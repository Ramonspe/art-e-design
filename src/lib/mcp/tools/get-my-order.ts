import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_my_order",
  title: "Get my order",
  description:
    "Fetch full details of one of the signed-in user's orders by order number, including items and shipping address.",
  inputSchema: {
    order_number: z.number().int().positive().describe("The public order number (e.g. 1001)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_number }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(product_name,variant,quantity,unit_price,subtotal,product_image)")
      .eq("user_id", ctx.getUserId())
      .eq("order_number", order_number)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!order) return { content: [{ type: "text", text: "Order not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(order) }],
      structuredContent: { order },
    };
  },
});
