import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useCategories, useProducts } from "@/data/catalog";

const Products = () => {
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") || "all";
  const q = (params.get("q") || "").trim().toLowerCase();
  const [sort, setSort] = useState("relevance");
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [openMobileFilters, setOpenMobileFilters] = useState(false);
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts();

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (q) list = list.filter((p) =>
      [p.name, p.description, p.category].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
    list = list.filter((p) => p.price <= maxPrice);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [cat, q, sort, maxPrice, products]);

  const setCat = (c: string) => {
    const p = new URLSearchParams(params);
    if (c === "all") p.delete("cat"); else p.set("cat", c);
    setParams(p);
  };

  const Filters = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Categorias</h3>
        <ul className="space-y-1">
          <li><button onClick={() => setCat("all")} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-smooth ${cat === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>Todas as categorias</button></li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button onClick={() => setCat(c.slug)} className={`w-full text-left px-3 py-2 rounded-md text-sm transition-smooth ${cat === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{c.name}</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Preço máximo</h3>
        <input type="range" min={20} max={500} step={10} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
        <p className="text-sm mt-1">até R$ {maxPrice}</p>
      </div>
    </div>
  );

  const currentCat = categories.find((c) => c.slug === cat);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{q ? `Resultados para "${q}"` : currentCat?.name || "Todos os Produtos"}</h1>
        <p className="text-muted-foreground mt-1">{q ? `${filtered.length} produto(s) encontrado(s)` : currentCat?.description || "Explore toda a nossa linha de produtos personalizados."}</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">{Filters}</aside>

        <div>
          <div className="flex items-center justify-between mb-5 gap-3">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setOpenMobileFilters((o) => !o)}>
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </Button>
            <p className="text-sm text-muted-foreground hidden sm:block">{filtered.length} produtos encontrados</p>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto h-10 rounded-md border border-input bg-background px-3 text-sm" aria-label="Ordenar">
              <option value="relevance">Mais relevantes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>

          {openMobileFilters && <div className="lg:hidden mb-6 p-4 rounded-lg border border-border bg-card">{Filters}</div>}

          {isLoading ? (
            <p className="py-20 text-center text-muted-foreground">Carregando produtos…</p>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
