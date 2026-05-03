import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { toast } from "sonner";

const badgeStyle: Record<string, string> = {
  novo: "bg-secondary text-secondary-foreground",
  "mais-vendido": "bg-accent text-accent-foreground",
  promo: "bg-cta text-cta-foreground",
};
const badgeLabel: Record<string, string> = {
  novo: "Novo",
  "mais-vendido": "Mais vendido",
  promo: "Promoção",
};

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-card-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <Link to={`/produto/${product.slug}`} className="block aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-smooth group-hover:scale-105"
        />
      </Link>
      {product.badge && (
        <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeStyle[product.badge]}`}>
          {badgeLabel[product.badge]}
        </span>
      )}
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/produto/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-foreground hover:text-primary transition-smooth min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        <div className="mt-3 flex items-baseline gap-2">
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatBRL(product.oldPrice)}</span>
          )}
          <span className="text-lg font-bold text-primary">{formatBRL(product.price)}</span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">em até 6x sem juros</p>
        <Button
          variant="cta"
          size="sm"
          className="mt-4"
          onClick={() => {
            addItem(product);
            toast.success("Adicionado ao carrinho", { description: product.name });
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </article>
  );
};

export default ProductCard;
