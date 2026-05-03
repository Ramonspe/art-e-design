import { Link } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, formatBRL } from "@/contexts/CartContext";

const Cart = () => {
  const { items, updateQuantity, removeItem, subtotal, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mt-2">Que tal explorar nossos produtos personalizados?</p>
        <Button asChild variant="cta" size="lg" className="mt-6"><Link to="/produtos">Ver produtos</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Carrinho ({count} {count === 1 ? "item" : "itens"})</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variant}`} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
              <img src={item.image} alt={item.name} className="h-24 w-24 rounded-lg object-cover bg-muted" />
              <div className="flex-1">
                <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                {item.variant && <p className="text-xs text-muted-foreground mt-1">{item.variant}</p>}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-md border border-border">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)} className="px-2 py-1 hover:bg-muted" aria-label="Diminuir"><Minus className="h-3 w-3" /></button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)} className="px-2 py-1 hover:bg-muted" aria-label="Aumentar"><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="font-bold text-primary">{formatBRL(item.price * item.quantity)}</p>
                </div>
              </div>
              <button onClick={() => removeItem(item.productId, item.variant)} className="self-start text-muted-foreground hover:text-destructive" aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <aside className="h-fit p-6 rounded-xl border border-border bg-card sticky top-28">
          <h2 className="font-bold text-lg mb-4">Resumo do pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>Calculado no checkout</span></div>
          </div>
          <div className="border-t border-border my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatBRL(subtotal)}</span>
          </div>
          <p className="text-xs text-secondary font-medium mt-1 text-right">em até 6x sem juros</p>
          <Button asChild variant="cta" size="lg" className="w-full mt-6"><Link to="/checkout">Finalizar compra</Link></Button>
          <Button asChild variant="ghost" size="sm" className="w-full mt-2"><Link to="/produtos">Continuar comprando</Link></Button>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
