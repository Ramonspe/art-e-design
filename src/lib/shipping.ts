import { supabase } from "@/integrations/supabase/client";

export type ShippingQuote = {
  serviceId: number;
  label: string;
  price: number;
  deliveryMin: number;
  deliveryMax: number;
};

export type ShippingCartItem = { productId: string; quantity: number };

const cleanCep = (cep: string) => cep.replace(/\D/g, "");

export async function fetchAddressByCep(cep: string) {
  const c = cleanCep(cep);
  if (c.length !== 8) throw new Error("CEP inválido");
  const response = await fetch(`https://viacep.com.br/ws/${c}/json/`);
  const data = await response.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return {
    cep: c,
    street: data.logradouro || "",
    district: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

export async function quoteShipping(cep: string, items: ShippingCartItem[]): Promise<ShippingQuote[]> {
  const c = cleanCep(cep);
  if (c.length !== 8) throw new Error("CEP inválido");
  if (items.length === 0) return [];
  const { data, error } = await supabase.functions.invoke("quote-superfrete", {
    body: { postal_code: c, items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })) },
  });
  if (error) throw error;
  if (!Array.isArray(data?.quotes)) throw new Error(data?.error || "Não foi possível calcular o frete.");
  return parseShippingQuotes(data.quotes);
}

export function parseShippingQuotes(quotes: unknown[]): ShippingQuote[] {
  return quotes.flatMap((quote: unknown) => {
    if (!quote || typeof quote !== "object") return [];
    const item = quote as Record<string, unknown>;
    const serviceId = Number(item.service_id);
    const price = Number(item.price);
    const deliveryMin = Number(item.delivery_min);
    const deliveryMax = Number(item.delivery_max);
    if (!Number.isInteger(serviceId) || !Number.isFinite(price) || !Number.isFinite(deliveryMin) || !Number.isFinite(deliveryMax)) return [];
    return [{ serviceId, label: String(item.label || `Serviço ${serviceId}`), price, deliveryMin, deliveryMax }];
  });
}
