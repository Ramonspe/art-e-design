import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);
    const { data: role } = await admin.from("user_roles").select("id").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Forbidden" }, 403);

    const { order_id: orderId } = await req.json().catch(() => ({}));
    if (typeof orderId !== "string") return json({ error: "Invalid order" }, 400);
    const { data: order, error: orderError } = await admin.from("orders").select("id,status").eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.status !== "cancelado") return json({ error: "Somente pedidos cancelados podem ser excluídos." }, 409);

    const { error: deleteError } = await admin.from("orders").delete().eq("id", order.id);
    if (deleteError) throw deleteError;
    return json({ ok: true });
  } catch (error: unknown) {
    console.error("Delete cancelled order failed", error);
    return json({ error: "Não foi possível excluir o pedido." }, 500);
  }
});
