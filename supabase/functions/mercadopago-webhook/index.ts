// Mercado Pago Webhook receiver
// - Accepts POST notifications from Mercado Pago
// - Validates the `x-signature` HMAC using MERCADOPAGO_WEBHOOK_SECRET
// - Fetches the payment from the MP API using MERCADOPAGO_ACCESS_TOKEN
// - Updates the corresponding order in the database based on the real payment status
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendOrderStatusEmail } from '../_shared/order-email.ts'
import { createSuperfreteShipment, type SuperfreteVolume } from '../_shared/superfrete.ts'

const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''
const MP_WEBHOOK_SECRET = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET') ?? ''

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

function parseSignatureHeader(header: string | null): { ts?: string; v1?: string } {
  if (!header) return {}
  const out: Record<string, string> = {}
  for (const part of header.split(',')) {
    const [k, v] = part.split('=').map((s) => s.trim())
    if (k && v) out[k] = v
  }
  return { ts: out.ts, v1: out.v1 }
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

// Maps a Mercado Pago payment status to a valid public.order_status enum value.
// Valid enum values: 'pendente','confirmado','em_producao','enviado','entregue','cancelado'.
function mpStatusToOrderStatus(status: string): string {
  switch (status) {
    case 'approved':
      return 'confirmado'
    case 'cancelled':
    case 'refunded':
    case 'charged_back':
    case 'rejected':
      return 'cancelado'
    // pending / in_process / authorized → keep as awaiting: leave order in 'pendente'
    default:
      return 'pendente'
  }
}

function asVolume(value: unknown): SuperfreteVolume | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const height = Number(input.height)
  const width = Number(input.width)
  const length = Number(input.length)
  const weight = Number(input.weight)
  return [height, width, length, weight].every((item) => Number.isFinite(item) && item > 0)
    ? { height, width, length, weight }
    : null
}

async function createSuperfreteLabel(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .update({ superfrete_status: 'creating' })
    .eq('id', orderId)
    .is('superfrete_order_id', null)
    .is('superfrete_status', null)
    .select('id,order_number,subtotal,customer_name,customer_email,customer_phone,customer_cpf,shipping_cep,shipping_street,shipping_number,shipping_complement,shipping_district,shipping_city,shipping_state,superfrete_service_id,superfrete_volume,order_items(product_name,quantity,unit_price)')
    .maybeSingle()
  if (error) throw error
  if (!order) return

  try {
    const volume = asVolume(order.superfrete_volume)
    if (!volume || !order.superfrete_service_id || !order.customer_cpf) {
      throw new Error('Pedido aprovado sem dados completos para criar a etiqueta SuperFrete.')
    }
    const shipment = await createSuperfreteShipment({
      orderNumber: order.order_number,
      subtotal: Number(order.subtotal),
      serviceId: order.superfrete_service_id,
      volume,
      recipient: {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        document: order.customer_cpf,
        address: order.shipping_street,
        number: order.shipping_number,
        complement: order.shipping_complement,
        district: order.shipping_district,
        city: order.shipping_city,
        state: order.shipping_state,
        postalCode: order.shipping_cep,
      },
      products: order.order_items.map((item) => ({ name: item.product_name, quantity: item.quantity, unitPrice: Number(item.unit_price) })),
    })
    const rawResult = shipment && typeof shipment === 'object' ? shipment as Record<string, unknown> : {}
    const result = rawResult.data && typeof rawResult.data === 'object' ? rawResult.data as Record<string, unknown> : rawResult
    const nestedOrder = result.order && typeof result.order === 'object' ? result.order as Record<string, unknown> : {}
    const orderIdFromSuperfrete = String(result.id ?? nestedOrder.id ?? '')
    if (!orderIdFromSuperfrete) throw new Error('A SuperFrete não retornou o identificador da etiqueta.')
    const status = String(result.status ?? nestedOrder.status ?? 'pending')
    const tracking = result.tracking ?? nestedOrder.tracking
    const print = result.print ?? nestedOrder.print
    const labelUrl = print && typeof print === 'object' ? (print as Record<string, unknown>).url : null
    const { error: updateError } = await supabase.from('orders').update({
      superfrete_order_id: orderIdFromSuperfrete,
      superfrete_status: status,
      superfrete_tracking_code: typeof tracking === 'string' ? tracking : null,
      superfrete_label_url: typeof labelUrl === 'string' ? labelUrl : null,
    }).eq('id', order.id)
    if (updateError) throw updateError
  } catch (error) {
    await supabase.from('orders').update({ superfrete_status: null }).eq('id', order.id).eq('superfrete_status', 'creating')
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!MP_ACCESS_TOKEN || !MP_WEBHOOK_SECRET) {
    console.error('Missing MP secrets')
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rawBody = await req.text()
  const url = new URL(req.url)
  const queryDataId = url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const { ts, v1 } = parseSignatureHeader(req.headers.get('x-signature'))

  // Parse body to get data.id (MP sends { type, data: { id } })
  type WebhookBody = { data?: { id?: string | number } }
  let body: WebhookBody = {}
  try { body = rawBody ? JSON.parse(rawBody) as WebhookBody : {} } catch { /* mantém o corpo vazio */ }
  const dataId = String(body?.data?.id ?? queryDataId ?? '')

  if (!ts || !v1) {
    return new Response(JSON.stringify({ error: 'Missing signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // MP manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = await hmacSha256Hex(MP_WEBHOOK_SECRET, manifest)
  if (!timingSafeEqual(expected, v1)) {
    console.warn('Invalid MP signature', { manifest })
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const topic = body?.type ?? body?.topic ?? url.searchParams.get('type') ?? ''
  if (topic && !String(topic).includes('payment')) {
    // Ack non-payment topics without processing
    return new Response(JSON.stringify({ received: true, ignored: topic }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!dataId) {
    return new Response(JSON.stringify({ error: 'Missing data.id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch real payment from Mercado Pago
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  })
  if (!mpRes.ok) {
    const txt = await mpRes.text()
    console.error('MP payment fetch failed', mpRes.status, txt)
    return new Response(JSON.stringify({ error: 'Payment fetch failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const payment = await mpRes.json()

  const externalRef = payment?.external_reference
  const mpStatus = String(payment?.status ?? '')
  const status = mpStatusToOrderStatus(mpStatus)
  const paidAt = payment?.status === 'approved'
    ? (payment?.date_approved ?? new Date().toISOString())
    : null

  if (!externalRef) {
    console.warn('Payment missing external_reference', payment?.id)
    return new Response(JSON.stringify({ received: true, note: 'no external_reference' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const update: Record<string, unknown> = {
    status,
    payment_status: mpStatus,
    mp_payment_id: String(payment.id),
  }
  if (paidAt) update.paid_at = paidAt

  const { data: previousOrder, error: previousOrderError } = await supabase
    .from('orders')
    .select('id, user_id, customer_email, customer_name, order_number, status, payment_status, total')
    .eq('id', externalRef)
    .maybeSingle()

  if (previousOrderError || !previousOrder) {
    console.error('Order lookup failed', previousOrderError)
    return new Response(JSON.stringify({ error: 'Order not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { error: updErr } = await supabase
    .from('orders')
    .update(update)
    .eq('id', externalRef)

  if (updErr) {
    console.error('Order update failed', updErr)
    return new Response(JSON.stringify({ error: 'Order update failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const paymentWasApproved = mpStatus === 'approved' && previousOrder.payment_status !== 'approved'
  const paymentWasCancelled = status === 'cancelado' && previousOrder.status !== status
  if (paymentWasApproved) {
    try {
      await createSuperfreteLabel(externalRef)
    } catch (error) {
      console.error('SuperFrete label creation failed', { orderId: externalRef, error: error instanceof Error ? error.message : 'unknown error' })
      return new Response(JSON.stringify({ error: 'SuperFrete label creation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }
  if (paymentWasApproved || paymentWasCancelled) {
    if (!previousOrder.user_id) {
      await sendOrderStatusEmail({ ...previousOrder, status })
    } else {
      const { data: profile } = await supabase.from('profiles').select('order_updates_email_consent').eq('id', previousOrder.user_id).maybeSingle()
      if (profile?.order_updates_email_consent) await sendOrderStatusEmail({ ...previousOrder, status })
    }
  }

  return new Response(
    JSON.stringify({ received: true, order_id: externalRef, status }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
