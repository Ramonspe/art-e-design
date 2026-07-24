// Return a safe, minimal view of an order for the confirmation page.
//
// Guests (user_id NULL) can't read their order through RLS, so the confirmation page
// asks this function instead. It exposes ONLY non-sensitive fields (no full address,
// no e-mail/phone/CPF). The order id is a random UUID, so it acts as an unguessable
// access token for this limited view.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return json({ error: "order_id required" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await supabase
      .from("orders")
      .select("order_number, total, status, payment_status, shipping_city, shipping_state")
      .eq("id", order_id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return json({ order: null }, 404);

    return json({ order: data });
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});
