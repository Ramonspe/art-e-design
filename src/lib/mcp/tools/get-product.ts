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
  name: "get_product",
  title: "Get product",
  description: "Fetch a single product by slug, including full description, gallery and variants.",
  inputSchema: {
    slug: z.string().trim().min(1).describe("The product slug (URL segment)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data: product, error } = await supabase
      .from("products")
      .select("*, product_variants(label, options, sort_order)")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!product) return { content: [{ type: "text", text: "Product not found" }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(product) }],
      structuredContent: { product },
    };
  },
});
