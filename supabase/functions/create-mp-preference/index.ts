// Create the order (server-side, service_role) + Mercado Pago Checkout Pro preference.
//
// Why server-side: guest checkout inserts an order with user_id = NULL. The client
// cannot INSERT+SELECT it back (RLS SELECT policy only exposes the buyer's own rows),
// which surfaces as "new row violates row-level security policy for table orders".
// Creating the order here with the service role bypasses RLS safely and returns the
// data the client needs (order_number, init_point).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type IncomingItem = {
  product_id?: string | null;
  product_name: string;
  product_image?: string | null;
  variant?: string | null;
  unit_price: number;
  quantity: number;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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
    const items: IncomingItem[] = Array.isArray(payload?.items) ? payload.items : [];

    if (!orderInput || items.length === 0) {
      return json({ error: "order and items are required" }, 400);
    }

    // Derive the buyer from the JWT when authenticated; guests stay anonymous (user_id NULL).
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    // Recompute money server-side so the client cannot tamper with totals.
    const cleanItems = items.map((it) => {
      const unit = Number(it.unit_price) || 0;
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 0));
      return {
        product_id: it.product_id || null,
        product_name: String(it.product_name || "").slice(0, 300),
        product_image: it.product_image || null,
        variant: it.variant || null,
        unit_price: unit,
        quantity: qty,
        subtotal: Number((unit * qty).toFixed(2)),
      };
    });

    const subtotal = Number(
      cleanItems.reduce((s, it) => s + it.subtotal, 0).toFixed(2),
    );
    const shippingCost = Math.max(0, Number(orderInput.shipping_cost) || 0);
    const total = Number((subtotal + shippingCost).toFixed(2));

    // Insert the order (service role → RLS bypassed safely).
    const { data: order, error: oErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        customer_name: String(orderInput.customer_name || "").slice(0, 120),
        customer_email: String(orderInput.customer_email || "").slice(0, 255),
        customer_phone: String(orderInput.customer_phone || "").slice(0, 30),
        customer_cpf: orderInput.customer_cpf || null,
        shipping_cep: orderInput.shipping_cep || "",
        shipping_street: orderInput.shipping_street || "",
        shipping_number: orderInput.shipping_number || "",
        shipping_complement: orderInput.shipping_complement || null,
        shipping_district: orderInput.shipping_district || "",
        shipping_city: orderInput.shipping_city || "",
        shipping_state: orderInput.shipping_state || "",
        shipping_method: orderInput.shipping_method || null,
        shipping_cost: shippingCost,
        subtotal,
        total,
        payment_method: "mercadopago",
        payment_status: "pending",
        notes: orderInput.notes || null,
      })
      .select()
      .single();
    if (oErr || !order) throw new Error(oErr?.message || "failed to create order");

    // Insert the items.
    const itemsRows = cleanItems.map((it) => ({ ...it, order_id: order.id }));
    const { error: iErr } = await supabase.from("order_items").insert(itemsRows);
    if (iErr) {
      // Roll back the order so we don't leave an itemless order behind.
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(iErr.message);
    }

    const origin = req.headers.get("origin") || "https://art-print-commerce-hub.lovable.app";

    const nameParts = (order.customer_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const mpItems = cleanItems.map((it) => ({
      id: it.product_id || order.id,
      title: it.variant ? `${it.product_name} - ${it.variant}` : it.product_name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      currency_id: "BRL",
      picture_url: it.product_image || undefined,
    }));

    if (shippingCost > 0) {
      mpItems.push({
        id: "shipping",
        title: `Frete - ${order.shipping_method || "Entrega"}`,
        quantity: 1,
        unit_price: shippingCost,
        currency_id: "BRL",
        picture_url: undefined,
      });
    }

    const preference = {
      items: mpItems,
      payer: {
        name: firstName,
        surname: lastName,
        email: order.customer_email,
        phone: { number: order.customer_phone || "" },
        identification: order.customer_cpf
          ? { type: "CPF", number: String(order.customer_cpf).replace(/\D/g, "") }
          : undefined,
        address: {
          zip_code: (order.shipping_cep || "").replace(/\D/g, ""),
          street_name: order.shipping_street || "",
          street_number: order.shipping_number || "",
        },
      },
      external_reference: order.id,
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/mercadopago-webhook`,
      back_urls: {
        success: `${origin}/pedido-confirmado?order=${order.id}`,
        pending: `${origin}/pedido-confirmado?order=${order.id}`,
        failure: `${origin}/checkout?erro=pagamento`,
      },
      auto_return: "approved",
      statement_descriptor: "ART PERSONALIZADOS",
      metadata: { order_id: order.id, order_number: order.order_number },
    };

    // The order is already persisted. If Mercado Pago fails from here on, we still
    // return the order (200) so the client can show the "pedido registrado" fallback
    // instead of a hard error and a lost order.
    try {
      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preference),
      });

      const mpData = await mpRes.json();
      if (!mpRes.ok) {
        console.error("MP error:", mpData);
        return json({
          order_id: order.id,
          order_number: order.order_number,
          error: mpData.message || "Falha ao criar preferência",
        });
      }

      await supabase
        .from("orders")
        .update({ mp_preference_id: mpData.id, payment_status: "pending" })
        .eq("id", order.id);

      return json({
        order_id: order.id,
        order_number: order.order_number,
        preference_id: mpData.id,
        init_point: mpData.init_point,
        sandbox_init_point: mpData.sandbox_init_point,
      });
    } catch (mpErr: any) {
      console.error("MP request failed:", mpErr);
      return json({
        order_id: order.id,
        order_number: order.order_number,
        error: mpErr?.message || "Falha ao contatar o Mercado Pago",
      });
    }
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});
