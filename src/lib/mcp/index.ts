import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import listMyOrders from "./tools/list-my-orders";
import getMyOrder from "./tools/get-my-order";

// Build the direct supabase.co issuer from the project ref (Vite inlines this at build time).
// Do NOT use SUPABASE_URL — Lovable Cloud proxies via .lovable.cloud and mcp-js will reject
// mismatched issuers per RFC 8414.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "art-personalizados-mcp",
  title: "Art & Personalizados",
  version: "0.1.0",
  instructions:
    "Tools for the Art & Personalizados online store. Use `search_products`, `get_product` and `list_categories` to browse the catalog. Use `list_my_orders` and `get_my_order` to look up the signed-in customer's orders (row-level security scopes results to that user).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, getProduct, listCategories, listMyOrders, getMyOrder],
});
