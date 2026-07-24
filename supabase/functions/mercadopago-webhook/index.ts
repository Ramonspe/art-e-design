// Mercado Pago Webhook receiver
// - Accepts POST notifications from Mercado Pago
// - Validates the `x-signature` HMAC using MERCADOPAGO_WEBHOOK_SECRET
// - Fetches the payment from the MP API using MERCADOPAGO_ACCESS_TOKEN
// - Updates the corresponding order in the database based on the real payment status
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

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
  let body: any = {}
  try { body = rawBody ? JSON.parse(rawBody) : {} } catch { body = {} }
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

  return new Response(
    JSON.stringify({ received: true, order_id: externalRef, status }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
