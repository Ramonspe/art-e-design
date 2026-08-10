import { createClient } from "npm:@supabase/supabase-js@2";
import { calculateSuperfrete } from "../_shared/superfrete.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

type IncomingItem = { product_id?: string; quantity?: number };
type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number | null;
  shipping_weight_kg: number | null;
  shipping_height_cm: number | null;
  shipping_width_cm: number | null;
  shipping_length_cm: number | null;
};

const stringValue = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const destinationPostalCode = stringValue(body?.postal_code, 16).replace(/\D/g, "");
    const incomingItems: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
    if (destinationPostalCode.length !== 8 || incomingItems.length === 0) return json({ error: "CEP e itens são obrigatórios." }, 400);

    const requested = new Map<string, number>();
    for (const item of incomingItems) {
      const productId = stringValue(item.product_id, 36);
      const quantity = Math.floor(Number(item.quantity));
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return json({ error: "Item do carrinho inválido." }, 400);
      requested.set(productId, (requested.get(productId) ?? 0) + quantity);
    }
    if ([...requested.values()].some((quantity) => quantity > 100)) return json({ error: "Quantidade inválida." }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const productIds = [...requested.keys()];
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,stock,shipping_weight_kg,shipping_height_cm,shipping_width_cm,shipping_length_cm")
      .in("id", productIds)
      .eq("active", true);
    if (error) throw error;
    if (!data || data.length !== productIds.length) return json({ error: "Um ou mais produtos não estão disponíveis." }, 409);

    const products = (data as ProductRow[]).map((product) => {
      const quantity = requested.get(product.id)!;
      if (product.stock !== null && quantity > product.stock) throw new Error(`Estoque insuficiente para ${product.name}.`);
      return { ...product, quantity };
    });
    const quotes = await calculateSuperfrete(products, destinationPostalCode);
    if (quotes.length === 0) return json({ error: "Não há modalidades disponíveis para este CEP." }, 422);

    return json({
      quotes: quotes.map((quote) => ({
        service_id: quote.serviceId,
        label: quote.serviceName,
        price: quote.price,
        delivery_min: quote.deliveryMin,
        delivery_max: quote.deliveryMax,
      })),
    });
  } catch (error: unknown) {
    console.error("SuperFrete quote failed", error);
    return json({ error: error instanceof Error ? error.message : "Não foi possível calcular o frete." }, 500);
  }
});
