import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ShoppingCart, Truck, ShieldCheck, RefreshCw, ChevronRight, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProduct, useProducts } from "@/data/catalog";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { resolveImage } from "@/lib/imageMap";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";

const ProductDetail = () => {
  const { slug } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: all = [] } = useProducts();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string>("");

  if (isLoading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!product) return <Navigate to="/produtos" replace />;

  const v = variant || product.variants?.[0]?.options[0] || "";
  const cover = resolveImage(product.image);
  const gallery = (product.gallery || []).map(resolveImage);
  const allImages = [cover, ...gallery.filter((g) => g !== cover)];
  const [activeImg, setActiveImg] = useState(0);
  const related = all.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const ytId = (() => {
    if (!product.videoUrl) return null;
    const m = product.videoUrl.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : null;
  })();

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
          {ytId && (
            <div className="aspect-video overflow-hidden rounded-xl bg-black border border-border">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                title="Vídeo do produto"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div className="aspect-square overflow-hidden rounded-xl bg-muted border border-border">
            <img src={allImages[activeImg]} alt={product.name} width={800} height={800} className="h-full w-full object-cover" />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {allImages.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-smooth ${i === activeImg ? "border-primary" : "border-border hover:border-primary/50"}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.badge && <span className="inline-block rounded-full bg-accent text-accent-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider mb-3">Destaque</span>}
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">Cód.: {product.id.slice(0, 8).toUpperCase()}</p>

          <div className="mt-5 flex items-baseline gap-3">
            {product.oldPrice && <span className="text-base text-muted-foreground line-through">{formatBRL(product.oldPrice)}</span>}
            <span className="text-4xl font-bold text-primary">{formatBRL(product.price)}</span>
          </div>
          <p className="text-sm text-secondary font-medium mt-1">ou 6x de {formatBRL(product.price / 6)} sem juros</p>

          <p className="mt-6 text-sm leading-relaxed text-foreground/80">{product.description}</p>

          {product.variants?.map((vv) => (
            <div key={vv.label} className="mt-6">
              <label className="text-sm font-semibold mb-2 block">{vv.label}</label>
              <div className="flex flex-wrap gap-2">
                {vv.options.map((o) => (
                  <button key={o} onClick={() => setVariant(o)} className={`px-4 py-2 rounded-md border text-sm font-medium transition-smooth ${v === o ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>
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
            <Button variant="cta" size="lg" className="flex-1" onClick={() => {
              addItem({ ...product, image: img } as any, qty, v);
              toast.success("Adicionado ao carrinho", { description: `${qty}x ${product.name}` });
            }}>
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
