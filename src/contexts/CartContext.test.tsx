import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { Product } from "@/data/catalog";
import { CartProvider, useCart } from "@/contexts/CartContext";

const STORAGE_KEY = "art-cart-v1";

const product: Product = {
  id: "product-1",
  slug: "produto-teste",
  name: "Produto teste",
  description: "Produto usado nos testes do carrinho.",
  price: 25,
  image: "/produto-teste.jpg",
  category: "testes",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("carrega o carrinho salvo e calcula quantidade e subtotal", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 2,
        },
      ]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(2);
    expect(result.current.subtotal).toBe(50);
  });

  it("agrupa a mesma variante e mantém variantes diferentes separadas", async () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(product, 2, "Azul");
      result.current.addItem(product, 1, "Azul");
      result.current.addItem(product, 2, "Vermelho");
    });

    expect(result.current.items).toEqual([
      expect.objectContaining({ variant: "Azul", quantity: 3 }),
      expect.objectContaining({ variant: "Vermelho", quantity: 2 }),
    ]);
    expect(result.current.count).toBe(5);
    expect(result.current.subtotal).toBe(125);

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")).toHaveLength(2);
    });
  });

  it("limita a quantidade mínima, remove a variante correta e limpa o carrinho", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addItem(product, 2, "Azul");
      result.current.addItem(product, 1, "Vermelho");
    });

    act(() => {
      result.current.updateQuantity(product.id, 0, "Azul");
    });

    expect(result.current.items[0].quantity).toBe(1);

    act(() => {
      result.current.removeItem(product.id, "Vermelho");
    });

    expect(result.current.items).toEqual([
      expect.objectContaining({ variant: "Azul", quantity: 1 }),
    ]);

    act(() => {
      result.current.clear();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });
});
