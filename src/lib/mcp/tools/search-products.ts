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
  name: "search_products",
  title: "Search products",
  description:
    "Search Art & Personalizados products by keyword. Returns id, name, slug, price, category and short description.",
  inputSchema: {
    query: z.string().trim().default("").describe("Optional search text; empty returns featured/newest."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("products")
      .select("id,name,slug,price,old_price,description,image,category_id,badge,featured,active")
      .eq("active", true)
      .limit(limit);
    if (query && query.length > 0) {
      q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    } else {
      q = q.order("featured", { ascending: false }).order("created_at", { ascending: false });
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
