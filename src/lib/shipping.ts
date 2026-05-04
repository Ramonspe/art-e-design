import { supabase } from "@/integrations/supabase/client";

export type ShippingQuote = { rate_id: string; label: string; price: number; days: string };

const cleanCep = (cep: string) => cep.replace(/\D/g, "");

export async function fetchAddressByCep(cep: string) {
  const c = cleanCep(cep);
  if (c.length !== 8) throw new Error("CEP inválido");
  const r = await fetch(`https://viacep.com.br/ws/${c}/json/`);
  const data = await r.json();
  if (data.erro) throw new Error("CEP não encontrado");
  return {
    cep: c,
    street: data.logradouro || "",
    district: data.bairro || "",
    city: data.localidade || "",
    state: data.uf || "",
  };
}

export async function quoteShipping(cep: string): Promise<ShippingQuote | null> {
  const c = cleanCep(cep);
  if (c.length !== 8) throw new Error("CEP inválido");
  const { data, error } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("active", true);
  if (error) throw error;
  const match = (data || []).find((r: any) => c >= r.cep_start && c <= r.cep_end);
  if (!match) return null;
  return {
    rate_id: match.id,
    label: match.region_name,
    price: Number(match.price),
    days: `${match.delivery_days_min} a ${match.delivery_days_max} dias úteis`,
  };
}
