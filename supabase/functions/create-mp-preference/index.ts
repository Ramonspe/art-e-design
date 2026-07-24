// Create Mercado Pago Checkout Pro preference for an order
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "MP not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: oErr } = await supabase
      .from("orders").select("*").eq("id", order_id).single();
    if (oErr || !order) throw new Error(oErr?.message || "order not found");

    const { data: items, error: iErr } = await supabase
      .from("order_items").select("*").eq("order_id", order_id);
    if (iErr) throw iErr;

    const origin = req.headers.get("origin") || "https://art-print-commerce-hub.lovable.app";

    const nameParts = (order.customer_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const mpItems = (items || []).map((it: any) => ({
      id: it.product_id || it.id,
      title: it.variant ? `${it.product_name} - ${it.variant}` : it.product_name,
      quantity: it.quantity,
      unit_price: Number(it.unit_price),
      currency_id: "BRL",
      picture_url: it.product_image || undefined,
    }));

    if (order.shipping_cost && Number(order.shipping_cost) > 0) {
      mpItems.push({
        id: "shipping",
        title: `Frete - ${order.shipping_method || "Entrega"}`,
        quantity: 1,
        unit_price: Number(order.shipping_cost),
        currency_id: "BRL",
      });
    }

    const preference = {
      items: mpItems,
      payer: {
        name: firstName,
        surname: lastName,
        email: order.customer_email,
        phone: { number: order.customer_phone || "" },
        identification: order.customer_cpf ? { type: "CPF", number: order.customer_cpf.replace(/\D/g, "") } : undefined,
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
      throw new Error(mpData.message || "Falha ao criar preferência");
    }

    await supabase.from("orders").update({
      mp_preference_id: mpData.id,
      payment_status: "pending",
    }).eq("id", order.id);

    return new Response(JSON.stringify({
      preference_id: mpData.id,
      init_point: mpData.init_point,
      sandbox_init_point: mpData.sandbox_init_point,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
