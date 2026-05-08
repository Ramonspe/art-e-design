import { formatBRL } from "@/contexts/CartContext";

export const FREE_SHIPPING_MIN = 199;

export const qualifiesForFreeShipping = (subtotal: number) => subtotal >= FREE_SHIPPING_MIN;

export const remainingForFreeShipping = (subtotal: number) =>
  Math.max(0, FREE_SHIPPING_MIN - subtotal);

export const freeShippingMessage = (subtotal: number) => {
  if (qualifiesForFreeShipping(subtotal)) return "🎉 Sua compra tem FRETE GRÁTIS!";
  return `Faltam ${formatBRL(remainingForFreeShipping(subtotal))} para o frete grátis`;
};
