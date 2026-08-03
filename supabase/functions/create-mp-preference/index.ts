import { createClient } from "npm:@supabase/supabase-js@2";
import { sendOrderStatusEmail } from "../_shared/order-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

type IncomingItem = { product_id?: string | null; variant?: string | null; quantity?: number };
type ProductRow = { id: string; name: string; price: number; image: string; stock: number | null };
type VariantRow = { product_id: string; options: string[] };
type ShippingRate = { id: string; region_name: string; price: number; delivery_days_min: number; delivery_days_max: number };

const STATES = new Set(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"]);
const digitsOnly = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const stringValue = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function isValidCpf(value: string) {
  const cpf = digitsOnly(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digitAt = (length: number) => {
    const sum = cpf.slice(0, length).split("").reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digitAt(9) === Number(cpf[9]) && digitAt(10) === Number(cpf[10]);
}

function isValidBrazilianPhone(value: string) {
  return /^(?:[1-9]\d)(?:9\d{8}|[2-9]\d{7})$/.test(digitsOnly(value));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) return json({ error: "MP not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const payload = await req.json().catch(() => null);
    const orderInput = payload?.order;
    const incomingItems: IncomingItem[] = Array.isArray(payload?.items) ? payload.items : [];
    if (!orderInput || incomingItems.length === 0) return json({ error: "order and items are required" }, 400);

    const customerName = stringValue(orderInput.customer_name, 120);
    const customerEmail = stringValue(orderInput.customer_email, 255).toLowerCase();
    const customerPhone = stringValue(orderInput.customer_phone, 30);
    const customerCpf = digitsOnly(orderInput.customer_cpf);
    const shippingCep = digitsOnly(orderInput.shipping_cep);
    const shippingState = stringValue(orderInput.shipping_state, 2).toUpperCase();
    const address = {
      shipping_street: stringValue(orderInput.shipping_street, 200),
      shipping_number: stringValue(orderInput.shipping_number, 20),
      shipping_complement: stringValue(orderInput.shipping_complement, 120) || null,
      shipping_district: stringValue(orderInput.shipping_district, 120),
      shipping_city: stringValue(orderInput.shipping_city, 120),
    };
    if (customerName.length < 2 || !/^\S+@\S+\.\S+$/.test(customerEmail) || !isValidBrazilianPhone(customerPhone) || !isValidCpf(customerCpf) || shippingCep.length !== 8 || !STATES.has(shippingState) || Object.values(address).some((value) => value !== null && value.length === 0)) {
      return json({ error: "Invalid checkout data" }, 400);
    }

    const requested = new Map<string, { productId: string; variant: string | null; quantity: number }>();
    for (const item of incomingItems) {
      const productId = stringValue(item.product_id, 36);
      const variant = stringValue(item.variant, 120) || null;
      const quantity = Math.floor(Number(item.quantity));
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return json({ error: "Invalid cart item" }, 400);
      const key = `${productId}:${variant ?? ""}`;
      const existing = requested.get(key);
      requested.set(key, { productId, variant, quantity: (existing?.quantity ?? 0) + quantity });
    }
    if ([...requested.values()].some((item) => item.quantity > 100)) return json({ error: "Invalid item quantity" }, 400);

    const productIds = [...new Set([...requested.values()].map((item) => item.productId))];
    const [{ data: products, error: productsError }, { data: variants, error: variantsError }, { data: rates, error: ratesError }] = await Promise.all([
      supabase.from("products").select("id,name,price,image,stock").in("id", productIds).eq("active", true),
      supabase.from("product_variants").select("product_id,options").in("product_id", productIds),
      supabase.from("shipping_rates").select("id,region_name,price,delivery_days_min,delivery_days_max").eq("active", true).lte("cep_start", shippingCep).gte("cep_end", shippingCep).limit(1),
    ]);
    if (productsError || variantsError || ratesError) throw new Error(productsError?.message || variantsError?.message || ratesError?.message || "Failed to validate checkout");
    if (!products || products.length !== productIds.length) return json({ error: "One or more products are unavailable" }, 409);
    const shippingRate = rates?.[0] as ShippingRate | undefined;
    if (!shippingRate) return json({ error: "Shipping is unavailable for this CEP" }, 422);

    const productById = new Map((products as ProductRow[]).map((product) => [product.id, product]));
    const variantsByProduct = new Map<string, string[]>();
    for (const variant of (variants ?? []) as VariantRow[]) {
      variantsByProduct.set(variant.product_id, [...(variantsByProduct.get(variant.product_id) ?? []), ...variant.options]);
    }

    const cleanItems = [...requested.values()].map((item) => {
      const product = productById.get(item.productId)!;
      if (item.variant && !variantsByProduct.get(item.productId)?.includes(item.variant)) throw new Error("Invalid product variant");
      if (product.stock !== null && item.quantity > product.stock) throw new Error(`Insufficient stock for ${product.name}`);
      const unitPrice = Number(product.price);
      return {
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        variant: item.variant,
        unit_price: unitPrice,
        quantity: item.quantity,
        subtotal: Number((unitPrice * item.quantity).toFixed(2)),
      };
    });
    const subtotal = Number(cleanItems.reduce((total, item) => total + item.subtotal, 0).toFixed(2));
    const shippingCost = Number(Number(shippingRate.price).toFixed(2));
    const total = Number((subtotal + shippingCost).toFixed(2));

    let userId: string | null = null;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      user_id: userId,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_cpf: customerCpf,
      shipping_cep: shippingCep,
      ...address,
      shipping_state: shippingState,
      shipping_method: shippingRate.region_name,
      shipping_cost: shippingCost,
      subtotal,
      total,
      payment_method: "mercadopago",
      payment_status: "pending",
      notes: stringValue(orderInput.notes, 500) || null,
    }).select().single();
    if (orderError || !order) throw new Error(orderError?.message || "Failed to create order");

    const { error: itemsError } = await supabase.from("order_items").insert(cleanItems.map((item) => ({ ...item, order_id: order.id })));
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    await sendOrderStatusEmail(order);

    const siteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://art-print-commerce-hub.lovable.app";
    const nameParts = customerName.split(/\s+/);
    const preference = {
      items: [
        ...cleanItems.map((item) => ({ id: item.product_id, title: item.variant ? `${item.product_name} - ${item.variant}` : item.product_name, quantity: item.quantity, unit_price: item.unit_price, currency_id: "BRL", picture_url: item.product_image })),
        ...(shippingCost > 0 ? [{ id: "shipping", title: `Frete - ${shippingRate.region_name}`, quantity: 1, unit_price: shippingCost, currency_id: "BRL" }] : []),
      ],
      payer: {
        name: nameParts[0] || "",
        surname: nameParts.slice(1).join(" ") || nameParts[0] || "",
        email: customerEmail,
        phone: { number: customerPhone },
        identification: { type: "CPF", number: customerCpf },
        address: { zip_code: shippingCep, street_name: address.shipping_street, street_number: address.shipping_number },
      },
      external_reference: order.id,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      back_urls: { success: `${siteUrl}/pedido-confirmado?order=${order.id}`, pending: `${siteUrl}/pedido-confirmado?order=${order.id}`, failure: `${siteUrl}/checkout?erro=pagamento` },
      auto_return: "approved",
      statement_descriptor: "ART PERSONALIZADOS",
      metadata: { order_id: order.id, order_number: order.order_number },
    };

    try {
      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(preference),
      });
      const mpData = await mpResponse.json();
      if (!mpResponse.ok) {
        console.error("MP error", { status: mpResponse.status, orderNumber: order.order_number });
        return json({ order_id: order.id, order_number: order.order_number, error: mpData.message || "Falha ao criar preferência" });
      }

      await supabase.from("orders").update({ mp_preference_id: mpData.id, payment_status: "pending" }).eq("id", order.id);
      return json({ order_id: order.id, order_number: order.order_number, preference_id: mpData.id, init_point: mpData.init_point, sandbox_init_point: mpData.sandbox_init_point });
    } catch (error: unknown) {
      console.error("MP request failed", { orderNumber: order.order_number });
      return json({ order_id: order.id, order_number: order.order_number, error: error instanceof Error ? error.message : "Falha ao contatar o Mercado Pago" });
    }
  } catch (error: unknown) {
    console.error("Create preference failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
