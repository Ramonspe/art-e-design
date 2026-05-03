import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Product } from "@/data/catalog";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "art-cart-v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, quantity = 1, variant?: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.variant === variant);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
        return next;
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, image: product.image, quantity, variant }];
    });
  };

  const removeItem = (productId: string, variant?: string) =>
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variant === variant)));

  const updateQuantity = (productId: string, quantity: number, variant?: string) =>
    setItems((prev) => prev.map((i) =>
      i.productId === productId && i.variant === variant ? { ...i, quantity: Math.max(1, quantity) } : i
    ));

  const clear = () => setItems([]);

  const value = useMemo<CartContextValue>(() => ({
    items, addItem, removeItem, updateQuantity, clear,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const formatBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
