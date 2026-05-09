import { formatBRL } from "@/contexts/CartContext";

export const FREE_SHIPPING_MIN = 199;

// Grande São Paulo: CEPs de 01000-000 a 09999-999
export const isGreaterSaoPauloCep = (cep?: string | null) => {
  if (!cep) return false;
  const c = cep.replace(/\D/g, "");
  if (c.length !== 8) return false;
  return c >= "01000000" && c <= "09999999";
};

export const qualifiesForFreeShipping = (subtotal: number, cep?: string | null) =>
  subtotal >= FREE_SHIPPING_MIN && isGreaterSaoPauloCep(cep);

export const remainingForFreeShipping = (subtotal: number) =>
  Math.max(0, FREE_SHIPPING_MIN - subtotal);

export const freeShippingMessage = (subtotal: number, cep?: string | null) => {
  if (qualifiesForFreeShipping(subtotal, cep)) return "🎉 Sua compra tem FRETE GRÁTIS!";
  if (subtotal >= FREE_SHIPPING_MIN && !isGreaterSaoPauloCep(cep))
    return "Frete grátis disponível apenas para a Grande São Paulo";
  return `Faltam ${formatBRL(remainingForFreeShipping(subtotal))} para o frete grátis (Grande SP)`;
};
