import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ShoppingCart, Truck, ShieldCheck, RefreshCw, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProduct, products } from "@/data/catalog";
import { useCart, formatBRL } from "@/contexts/CartContext";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams();
  const product = slug ? getProduct(slug) : undefined;
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>(product?.variants?.[0]?.options[0] ?? "");

  if (!product) return <Navigate to="/produtos" replace />;

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container py-8">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Início</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/produtos" className="hover:text-primary">Produtos</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-xl bg-muted border border-border">
            <img src={product.image} alt={product.name} width={800} height={800} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[product.image, product.image, product.image, product.image].map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <img src={img} alt="" className="h-full w-full object-cover opacity-80 hover:opacity-100 cursor-pointer transition-smooth" />
              </div>
            ))}
          </div>
        </div>

        <div>
          {product.badge && <span className="inline-block rounded-full bg-accent text-accent-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-3">Destaque</span>}
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">Cód.: {product.id.toUpperCase()}</p>

          <div className="mt-5 flex items-baseline gap-3">
            {product.oldPrice && <span className="text-base text-muted-foreground line-through">{formatBRL(product.oldPrice)}</span>}
            <span className="text-4xl font-bold text-primary">{formatBRL(product.price)}</span>
          </div>
          <p className="text-sm text-secondary font-medium mt-1">ou 6x de {formatBRL(product.price / 6)} sem juros</p>

          <p className="mt-6 text-sm leading-relaxed text-foreground/80">{product.description}</p>

          {product.variants?.map((v) => (
            <div key={v.label} className="mt-6">
              <label className="text-sm font-semibold mb-2 block">{v.label}</label>
              <div className="flex flex-wrap gap-2">
                {v.options.map((o) => (
                  <button
                    key={o}
                    onClick={() => setVariant(o)}
                    className={`px-4 py-2 rounded-md border text-sm font-medium transition-smooth ${variant === o ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-muted" aria-label="Diminuir"><Minus className="h-4 w-4" /></button>
              <span className="px-4 font-semibold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-muted" aria-label="Aumentar"><Plus className="h-4 w-4" /></button>
            </div>
            <Button
              variant="cta"
              size="lg"
              className="flex-1"
              onClick={() => {
                addItem(product, qty, variant);
                toast.success("Adicionado ao carrinho", { description: `${qty}x ${product.name}` });
              }}
            >
              <ShoppingCart className="h-5 w-5" /> Adicionar ao carrinho
            </Button>
          </div>

          {product.template && (
            <Link to="/personalizado" className="block mt-3 text-sm text-secondary font-semibold hover:underline">
              Quer enviar sua própria arte para este produto? →
            </Link>
          )}

          <div className="mt-8 grid sm:grid-cols-3 gap-3 border-t border-border pt-6">
            <div className="flex items-center gap-2 text-xs"><Truck className="h-5 w-5 text-primary" /> Frete para todo Brasil</div>
            <div className="flex items-center gap-2 text-xs"><ShieldCheck className="h-5 w-5 text-primary" /> Compra protegida</div>
            <div className="flex items-center gap-2 text-xs"><RefreshCw className="h-5 w-5 text-primary" /> Trocas em até 7 dias</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Você também pode gostar</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
