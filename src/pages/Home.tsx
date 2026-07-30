import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Frame, Flag, Shirt, Coffee, Gift, CreditCard, Sticker, Truck, ShieldCheck, Sparkles, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import { useCategories, useProducts } from "@/data/catalog";
import { supabase } from "@/integrations/supabase/client";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

type Slide = { image: string; eyebrow?: string | null; title: string; subtitle?: string | null; cta_label?: string | null; cta_href?: string | null };

const fallbackSlides: Slide[] = [
  { image: hero1, eyebrow: "Coleção 2026", title: "Personalize tudo. Encante a todos.", subtitle: "Quadros, canecas, camisetas e brindes feitos com a sua arte.", cta_label: "Comprar agora", cta_href: "/produtos" },
  { image: hero2, eyebrow: "Camisetas Premium", title: "Sua marca em cada estampa.", subtitle: "Tecidos de alta qualidade e impressão de longa duração.", cta_label: "Ver camisetas", cta_href: "/produtos?cat=camisetas" },
  { image: hero3, eyebrow: "Decoração", title: "Quadros que transformam ambientes.", subtitle: "Impressão em canvas premium com molduras douradas.", cta_label: "Ver quadros", cta_href: "/produtos?cat=quadros" },
];

const iconMap: Record<string, any> = { Frame, Flag, Shirt, Coffee, Gift, CreditCard, Sticker };

const Home = () => {
  const [slide, setSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();

  useEffect(() => {
    supabase.from("hero_slides").select("*").eq("active", true).order("sort_order").then(({ data }) => {
      if (data && data.length > 0) setSlides(data as Slide[]);
    });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const novidades = products.filter((p) => p.badge === "novo").slice(0, 4);
  const maisVendidos = products.filter((p) => p.badge === "mais-vendido").slice(0, 4);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="relative h-[480px] md:h-[560px]">
          {slides.map((s, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <img src={s.image} alt="" width={1920} height={800} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />
              <div className="container relative h-full flex items-center">
                <div className="max-w-xl text-primary-foreground">
                  {s.eyebrow && <span className="inline-block rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">{s.eyebrow}</span>}
                  <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">{s.title}</h1>
                  {s.subtitle && <p className="mt-4 text-base md:text-lg text-primary-foreground/90">{s.subtitle}</p>}
                  <div className="mt-7 flex gap-3">
                    {s.cta_label && (
                      <Button asChild variant="cta" size="lg">
                        <Link to={s.cta_href || "/produtos"}>{s.cta_label} <ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    <Button asChild variant="outline" size="lg" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                      <Link to="/personalizado">Enviar minha arte</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className={`h-2 rounded-full transition-smooth ${i === slide ? "w-8 bg-accent" : "w-2 bg-primary-foreground/50"}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40">
        <div className="container py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, title: "Entrega para todo Brasil", desc: "Frete calculado no checkout" },
            { icon: ShieldCheck, title: "Compra 100% segura", desc: "Pagamento criptografado" },
            { icon: Sparkles, title: "Qualidade garantida", desc: "Materiais premium" },
            { icon: Headphones, title: "Atendimento humano", desc: "WhatsApp em horário comercial" },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><b.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Categorias</h2>
            <p className="text-muted-foreground mt-1">Escolha o tipo de produto que deseja personalizar</p>
          </div>
          <Link to="/produtos" className="text-sm font-semibold text-primary hover:underline hidden md:inline-flex items-center gap-1">Ver todos <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {categories.map((c) => {
            const Icon = iconMap[c.icon || ""] || Sparkles;
            return (
              <Link key={c.slug} to={`/produtos?cat=${c.slug}`} className="group flex flex-col items-center text-center p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-elegant transition-smooth">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft group-hover:bg-gold-gradient transition-smooth">
                  <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                </div>
                <span className="mt-3 text-sm font-medium">{c.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {novidades.length > 0 && (
        <section className="container py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Lançamentos</span>
              <h2 className="text-3xl font-bold">Novidades</h2>
            </div>
            <Link to="/produtos" className="text-sm font-semibold text-primary hover:underline">Ver mais →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {novidades.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <section className="container py-10">
        <div className="relative overflow-hidden rounded-2xl bg-gold-gradient text-primary-foreground p-8 md:p-12">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block rounded-full bg-cta text-cta-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">Personalização</span>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold">Tem uma arte? A gente imprime.</h2>
            <p className="mt-3 text-primary-foreground/90">Envie seu arquivo e receba um orçamento personalizado direto no WhatsApp.</p>
            <Button asChild variant="cta" size="lg" className="mt-6"><Link to="/personalizado">Enviar minha arte <ArrowRight className="h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      {maisVendidos.length > 0 && (
        <section className="container py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Clássicos</span>
              <h2 className="text-3xl font-bold">Mais Vendidos</h2>
            </div>
            <Link to="/produtos" className="text-sm font-semibold text-primary hover:underline">Ver mais →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {maisVendidos.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
