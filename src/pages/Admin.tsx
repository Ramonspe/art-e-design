import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Package, Tag, Truck, ShoppingBag, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/contexts/CartContext";
import { ImageUploader } from "@/components/admin/ImageUploader";

const links = [
  { to: "/admin", label: "Resumo", icon: LayoutDashboard, end: true },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tag },
  { to: "/admin/carrossel", label: "Carrossel", icon: ImageIcon },
  { to: "/admin/frete", label: "Frete", icon: Truck },
];

export const AdminLayout = () => (
  <div className="container py-8">
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Gerencie produtos, pedidos e configurações</p>
      </div>
      <Button asChild variant="outline" size="sm"><Link to="/"><ArrowLeft className="h-4 w-4" /> Voltar à loja</Link></Button>
    </div>
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <aside className="h-fit rounded-xl border border-border bg-card p-3">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-smooth ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <l.icon className="h-4 w-4" /> {l.label}
          </NavLink>
        ))}
      </aside>
      <main><Outlet /></main>
    </div>
  </div>
);

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, pending: 0 });
  useEffect(() => {
    (async () => {
      const [o, p] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      const orders = o.data || [];
      setStats({
        orders: orders.length,
        revenue: orders.reduce((s, x: any) => s + Number(x.total || 0), 0),
        pending: orders.filter((x: any) => x.status === "pendente").length,
        products: p.count || 0,
      });
    })();
  }, []);
  const cards = [
    { label: "Pedidos totais", value: stats.orders },
    { label: "Receita total", value: formatBRL(stats.revenue) },
    { label: "Pedidos pendentes", value: stats.pending },
    { label: "Produtos cadastrados", value: stats.products },
  ];
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
          <p className="text-3xl font-bold text-primary mt-2">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

const STATUS = ["pendente", "confirmado", "em_producao", "enviado", "entregue", "cancelado"] as const;

export const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const load = () => supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).then(({ data }) => setOrders(data || []));
  useEffect(() => { load(); }, []);
  const update = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    load();
  };
  return (
    <div className="space-y-3">
      {orders.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhum pedido ainda.</p>}
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-border bg-card">
          <button onClick={() => setOpen(open === o.id ? null : o.id)} className="w-full p-5 flex items-center justify-between flex-wrap gap-3 text-left hover:bg-muted/30">
            <div>
              <p className="font-bold">Pedido #{o.order_number} — {o.customer_name}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
            </div>
            <select value={o.status} onClick={(e) => e.stopPropagation()} onChange={(e) => update(o.id, e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="font-bold text-primary">{formatBRL(Number(o.total))}</p>
          </button>
          {open === o.id && (
            <div className="border-t border-border p-5 text-sm space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <div><strong>Email:</strong> {o.customer_email}</div>
                <div><strong>Telefone:</strong> {o.customer_phone}</div>
                <div className="sm:col-span-2"><strong>Entrega:</strong> {o.shipping_street}, {o.shipping_number} {o.shipping_complement} - {o.shipping_district}, {o.shipping_city}/{o.shipping_state} - CEP {o.shipping_cep}</div>
                <div><strong>Frete:</strong> {o.shipping_method} ({formatBRL(Number(o.shipping_cost))})</div>
                <div><strong>Pagamento:</strong> {o.payment_method}</div>
                {o.notes && <div className="sm:col-span-2"><strong>Obs:</strong> {o.notes}</div>}
              </div>
              <div className="border-t border-border pt-3 mt-2">
                <p className="font-semibold mb-2">Itens</p>
                {o.order_items.map((i: any) => (
                  <div key={i.id} className="flex justify-between py-1">
                    <span>{i.quantity}x {i.product_name} {i.variant && `(${i.variant})`}</span>
                    <span>{formatBRL(Number(i.subtotal))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const [p, c] = await Promise.all([
      supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setProducts(p.data || []); setCats(c.data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    const images: string[] = editing._images || [];
    if (images.length === 0) { alert("Adicione pelo menos uma imagem do produto."); return; }
    const payload = {
      slug: fd.slug, name: fd.name, description: fd.description,
      price: Number(fd.price), old_price: fd.old_price ? Number(fd.old_price) : null,
      image: images[0], gallery: images.slice(1),
      video_url: fd.video_url ? String(fd.video_url).trim() : null,
      category_id: fd.category_id || null,
      badge: fd.badge || null, is_template: fd.is_template === "on",
      featured: fd.featured === "on", active: fd.active === "on",
    };
    const res = editing?.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (res.error) alert(res.error.message);
    else { setEditing(null); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  const startEdit = (p: any) => {
    const imgs: string[] = [];
    if (p.image && (p.image.startsWith("http") || p.image.startsWith("/"))) imgs.push(p.image);
    if (Array.isArray(p.gallery)) imgs.push(...p.gallery.filter((g: string) => !imgs.includes(g)));
    setEditing({ ...p, _images: imgs });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{products.length} produtos</p>
        <Button variant="cta" onClick={() => setEditing({ _images: [] })}>+ Novo produto</Button>
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border border-primary bg-card p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <h3 className="sm:col-span-2 font-bold">{editing.id ? "Editar" : "Novo"} produto</h3>
          <Input label="Nome" name="name" defaultValue={editing.name} required />
          <Input label="Slug" name="slug" defaultValue={editing.slug} required />
          <Input label="Preço" name="price" type="number" step="0.01" defaultValue={editing.price} required />
          <Input label="Preço antigo (opcional)" name="old_price" type="number" step="0.01" defaultValue={editing.old_price ?? ""} />
          <div className="sm:col-span-2"><label className="text-xs font-medium">Descrição</label>
            <textarea name="description" rows={3} defaultValue={editing.description} required className="w-full rounded-md border border-input bg-background p-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Categoria</label>
            <select name="category_id" defaultValue={editing.category_id || ""} className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">—</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="text-xs font-medium">Selo</label>
            <select name="badge" defaultValue={editing.badge || ""} className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm">
              <option value="">Nenhum</option><option value="novo">Novo</option><option value="mais-vendido">Mais vendido</option><option value="promo">Promoção</option>
            </select></div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Imagens do produto (a primeira é a capa)</label>
            <ImageUploader
              value={editing._images || []}
              onChange={(urls) => setEditing((e: any) => ({ ...e, _images: urls }))}
              recommended="800x800 px (quadrado, mínimo 600x600)"
              hint="Selecione várias imagens — a primeira aparece como capa, as demais ficam no carrossel."
              pathPrefix="products"
            />
          </div>

          <Input label="Vídeo do YouTube (URL — opcional)" name="video_url" defaultValue={editing.video_url || ""} placeholder="https://www.youtube.com/watch?v=..." wrapperClass="sm:col-span-2" />

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_template" defaultChecked={editing.is_template} /> Permite enviar arte</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={editing.featured} /> Destacar</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing.active ?? true} /> Ativo</label>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" variant="cta">Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase"><tr>
            <th className="text-left p-3">Produto</th><th className="text-left p-3">Categoria</th><th className="text-left p-3">Preço</th><th className="p-3">Ativo</th><th></th>
          </tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.categories?.name || "—"}</td>
                <td className="p-3">{formatBRL(Number(p.price))}</td>
                <td className="p-3 text-center">{p.active ? "✓" : "—"}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => startEdit(p)} className="text-primary hover:underline text-xs font-semibold">Editar</button>
                  <button onClick={() => del(p.id)} className="text-destructive hover:underline text-xs font-semibold">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminCategories = () => {
  const [cats, setCats] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const load = () => supabase.from("categories").select("*").order("sort_order").then(({ data }) => setCats(data || []));
  useEffect(() => { load(); }, []);
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    const payload = { slug: fd.slug, name: fd.name, description: fd.description, icon: fd.icon, sort_order: Number(fd.sort_order) || 0, active: fd.active === "on" };
    const res = editing?.id ? await supabase.from("categories").update(payload).eq("id", editing.id) : await supabase.from("categories").insert(payload);
    if (res.error) alert(res.error.message); else { setEditing(null); load(); }
  };
  const del = async (id: string) => { if (confirm("Excluir?")) { await supabase.from("categories").delete().eq("id", id); load(); } };
  return (
    <div>
      <div className="flex justify-between mb-4"><p className="text-sm text-muted-foreground">{cats.length} categorias</p><Button variant="cta" onClick={() => setEditing({ active: true })}>+ Nova</Button></div>
      {editing && (
        <form onSubmit={save} className="rounded-xl border border-primary bg-card p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <Input label="Nome" name="name" defaultValue={editing.name} required />
          <Input label="Slug" name="slug" defaultValue={editing.slug} required />
          <Input label="Ícone (Lucide: Frame, Shirt...)" name="icon" defaultValue={editing.icon || ""} />
          <Input label="Ordem" name="sort_order" type="number" defaultValue={editing.sort_order || 0} />
          <div className="sm:col-span-2"><label className="text-xs font-medium">Descrição</label><textarea name="description" rows={2} defaultValue={editing.description || ""} className="w-full rounded-md border border-input bg-background p-2 text-sm" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing.active ?? true} /> Ativa</label>
          <div className="sm:col-span-2 flex gap-2"><Button type="submit" variant="cta">Salvar</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
        </form>
      )}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase"><tr><th className="text-left p-3">Nome</th><th className="text-left p-3">Slug</th><th className="p-3">Ordem</th><th className="p-3">Ativa</th><th></th></tr></thead>
          <tbody>{cats.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="p-3 font-medium">{c.name}</td><td className="p-3 text-muted-foreground">{c.slug}</td><td className="p-3 text-center">{c.sort_order}</td><td className="p-3 text-center">{c.active ? "✓" : "—"}</td>
              <td className="p-3 text-right space-x-2"><button onClick={() => setEditing(c)} className="text-primary hover:underline text-xs font-semibold">Editar</button><button onClick={() => del(c.id)} className="text-destructive hover:underline text-xs font-semibold">Excluir</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminShipping = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const load = () => supabase.from("shipping_rates").select("*").order("cep_start").then(({ data }) => setRates(data || []));
  useEffect(() => { load(); }, []);
  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    const payload = {
      region_name: fd.region_name, cep_start: fd.cep_start.replace(/\D/g, "").padEnd(8, "0"),
      cep_end: fd.cep_end.replace(/\D/g, "").padEnd(8, "9"), price: Number(fd.price),
      delivery_days_min: Number(fd.delivery_days_min), delivery_days_max: Number(fd.delivery_days_max), active: fd.active === "on",
    };
    const res = editing?.id ? await supabase.from("shipping_rates").update(payload).eq("id", editing.id) : await supabase.from("shipping_rates").insert(payload);
    if (res.error) alert(res.error.message); else { setEditing(null); load(); }
  };
  const del = async (id: string) => { if (confirm("Excluir?")) { await supabase.from("shipping_rates").delete().eq("id", id); load(); } };
  return (
    <div>
      <div className="flex justify-between mb-4"><p className="text-sm text-muted-foreground">{rates.length} faixas de frete</p><Button variant="cta" onClick={() => setEditing({ active: true, delivery_days_min: 5, delivery_days_max: 10 })}>+ Nova faixa</Button></div>
      {editing && (
        <form onSubmit={save} className="rounded-xl border border-primary bg-card p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <Input label="Região" name="region_name" defaultValue={editing.region_name} required wrapperClass="sm:col-span-2" />
          <Input label="CEP inicial (8 dígitos)" name="cep_start" defaultValue={editing.cep_start} required />
          <Input label="CEP final (8 dígitos)" name="cep_end" defaultValue={editing.cep_end} required />
          <Input label="Preço (R$)" name="price" type="number" step="0.01" defaultValue={editing.price} required />
          <Input label="Prazo mínimo (dias)" name="delivery_days_min" type="number" defaultValue={editing.delivery_days_min} required />
          <Input label="Prazo máximo (dias)" name="delivery_days_max" type="number" defaultValue={editing.delivery_days_max} required />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing.active ?? true} /> Ativa</label>
          <div className="sm:col-span-2 flex gap-2"><Button type="submit" variant="cta">Salvar</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button></div>
        </form>
      )}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase"><tr><th className="text-left p-3">Região</th><th className="text-left p-3">Faixa CEP</th><th className="p-3">Prazo</th><th className="p-3">Preço</th><th className="p-3">Ativa</th><th></th></tr></thead>
          <tbody>{rates.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 font-medium">{r.region_name}</td><td className="p-3 text-muted-foreground text-xs">{r.cep_start} → {r.cep_end}</td>
              <td className="p-3 text-center text-xs">{r.delivery_days_min}-{r.delivery_days_max}d</td><td className="p-3">{formatBRL(Number(r.price))}</td><td className="p-3 text-center">{r.active ? "✓" : "—"}</td>
              <td className="p-3 text-right space-x-2"><button onClick={() => setEditing(r)} className="text-primary hover:underline text-xs font-semibold">Editar</button><button onClick={() => del(r.id)} className="text-destructive hover:underline text-xs font-semibold">Excluir</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

const Input = ({ label, wrapperClass = "", ...props }: { label: string; wrapperClass?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={wrapperClass}>
    <label className="text-xs font-medium mb-1 block">{label}</label>
    <input {...props} className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);

export const AdminSlides = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  const load = () =>
    supabase.from("hero_slides").select("*").order("sort_order").then(({ data }) => setSlides(data || []));
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    const image = (editing._images || [])[0];
    if (!image) { alert("Adicione uma imagem para o slide."); return; }
    const payload = {
      image,
      eyebrow: fd.eyebrow || null,
      title: fd.title,
      subtitle: fd.subtitle || null,
      cta_label: fd.cta_label || null,
      cta_href: fd.cta_href || null,
      sort_order: Number(fd.sort_order) || 0,
      active: fd.active === "on",
    };
    const res = editing?.id
      ? await supabase.from("hero_slides").update(payload).eq("id", editing.id)
      : await supabase.from("hero_slides").insert(payload);
    if (res.error) alert(res.error.message); else { setEditing(null); load(); }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{slides.length} slide(s) no carrossel da home</p>
        <Button variant="cta" onClick={() => setEditing({ _images: [], active: true, sort_order: slides.length })}>
          + Novo slide
        </Button>
      </div>

      {editing && (
        <form onSubmit={save} className="rounded-xl border border-primary bg-card p-5 mb-4 grid sm:grid-cols-2 gap-3">
          <h3 className="sm:col-span-2 font-bold">{editing.id ? "Editar" : "Novo"} slide</h3>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium mb-1 block">Imagem de fundo</label>
            <ImageUploader
              multiple={false}
              value={editing._images || []}
              onChange={(urls) => setEditing((e: any) => ({ ...e, _images: urls }))}
              recommended="1920x800 px (paisagem widescreen)"
              hint="Use imagens horizontais de alta qualidade para melhor resultado."
              pathPrefix="hero"
            />
          </div>
          <Input label="Tag (ex: Coleção 2026)" name="eyebrow" defaultValue={editing.eyebrow || ""} />
          <Input label="Ordem" name="sort_order" type="number" defaultValue={editing.sort_order ?? 0} />
          <Input label="Título" name="title" defaultValue={editing.title || ""} required wrapperClass="sm:col-span-2" />
          <Input label="Subtítulo" name="subtitle" defaultValue={editing.subtitle || ""} wrapperClass="sm:col-span-2" />
          <Input label="Texto do botão" name="cta_label" defaultValue={editing.cta_label || ""} placeholder="Comprar agora" />
          <Input label="Link do botão" name="cta_href" defaultValue={editing.cta_href || ""} placeholder="/produtos" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="active" defaultChecked={editing.active ?? true} /> Ativo
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" variant="cta">Salvar</Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {slides.length === 0 && <p className="text-muted-foreground text-center py-10">Nenhum slide cadastrado ainda.</p>}
        {slides.map((s) => (
          <div key={s.id} className="flex gap-4 rounded-xl border border-border bg-card p-3">
            <img src={s.image} alt="" className="h-20 w-32 rounded-md object-cover bg-muted" />
            <div className="flex-1 min-w-0">
              {s.eyebrow && <p className="text-xs font-bold uppercase tracking-wider text-secondary">{s.eyebrow}</p>}
              <p className="font-semibold truncate">{s.title}</p>
              <p className="text-xs text-muted-foreground truncate">{s.subtitle}</p>
              <p className="text-xs text-muted-foreground mt-1">Ordem: {s.sort_order} • {s.active ? "Ativo" : "Inativo"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => setEditing({ ...s, _images: s.image ? [s.image] : [] })}
                className="text-primary hover:underline text-xs font-semibold">Editar</button>
              <button onClick={() => del(s.id)} className="text-destructive hover:underline text-xs font-semibold">Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

