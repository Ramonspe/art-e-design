import { createClient } from "npm:@supabase/supabase-js@2";
import { sendOrderStatusEmail } from "../_shared/order-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const statuses = new Set(["pendente", "confirmado", "em_producao", "enviado", "entregue", "cancelado"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

    const { data: role } = await supabase.from("user_roles").select("id").eq("user_id", authData.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Forbidden" }, 403);

    const { order_id: orderId, status } = await req.json().catch(() => ({}));
    if (typeof orderId !== "string" || !statuses.has(status)) return json({ error: "Invalid order status" }, 400);

    const { data: order, error: orderError } = await supabase.from("orders").select("id,user_id,customer_email,customer_name,order_number,status,total").eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.status === status) return json({ order, changed: false });

    const { data: updated, error: updateError } = await supabase.from("orders").update({ status }).eq("id", orderId).select("id,order_number,status").single();
    if (updateError) throw updateError;
    if (!order.user_id) {
      await sendOrderStatusEmail({ ...order, status });
    } else {
      const { data: profile } = await supabase.from("profiles").select("order_updates_email_consent").eq("id", order.user_id).maybeSingle();
      if (profile?.order_updates_email_consent) await sendOrderStatusEmail({ ...order, status });
    }
    return json({ order: updated, changed: true });
  } catch (error: unknown) {
    console.error("Update order status failed", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});
