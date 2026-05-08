import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  active: boolean;
};

export type ProductVariant = { id: string; label: string; options: string[]; sort_order: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  gallery?: string[];
  category: string; // slug
  category_id?: string | null;
  variants?: { label: string; options: string[] }[];
  badge?: "novo" | "mais-vendido" | "promo" | null;
  template?: boolean;
  featured?: boolean;
  active?: boolean;
  stock?: number | null;
  videoUrl?: string | null;
};

const mapProduct = (row: any, catSlugById: Record<string, string>): Product => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  price: Number(row.price),
  oldPrice: row.old_price ? Number(row.old_price) : null,
  image: row.image,
  gallery: row.gallery || [],
  category: catSlugById[row.category_id] || "",
  category_id: row.category_id,
  variants: (row.product_variants || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((v: any) => ({ label: v.label, options: v.options })),
  badge: row.badge,
  template: row.is_template,
  featured: row.featured,
  active: row.active,
  stock: row.stock,
  videoUrl: row.video_url || null,
});

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
  });

export const useProducts = (opts?: { category?: string; activeOnly?: boolean }) =>
  useQuery({
    queryKey: ["products", opts],
    queryFn: async () => {
      const cats = await supabase.from("categories").select("id, slug");
      const catSlugById: Record<string, string> = {};
      (cats.data || []).forEach((c: any) => (catSlugById[c.id] = c.slug));

      let q = supabase.from("products").select("*, product_variants(*)");
      if (opts?.activeOnly !== false) q = q.eq("active", true);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      let list = (data || []).map((r) => mapProduct(r, catSlugById));
      if (opts?.category) list = list.filter((p) => p.category === opts.category);
      return list;
    },
  });

export const useProduct = (slug?: string) =>
  useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const cats = await supabase.from("categories").select("id, slug");
      const catSlugById: Record<string, string> = {};
      (cats.data || []).forEach((c: any) => (catSlugById[c.id] = c.slug));
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProduct(data, catSlugById) : null;
    },
  });
