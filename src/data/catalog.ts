import mug from "@/assets/prod-mug.jpg";
import tshirt from "@/assets/prod-tshirt.jpg";
import canvas from "@/assets/prod-canvas.jpg";
import banner from "@/assets/prod-banner.jpg";
import brindes from "@/assets/prod-brindes.jpg";
import cards from "@/assets/prod-cards.jpg";
import adesivos from "@/assets/prod-adesivos.jpg";

export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: string; // lucide name
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery?: string[];
  category: string;
  variants?: { label: string; options: string[] }[];
  badge?: "novo" | "mais-vendido" | "promo";
  template?: boolean;
};

export const categories: Category[] = [
  { slug: "quadros", name: "Quadros & Telas", description: "Decore qualquer ambiente com quadros personalizados em tela canvas de alta resolução.", icon: "Frame" },
  { slug: "banners", name: "Banners & Lonas", description: "Banners impressos em lona resistente para eventos, lojas e fachadas.", icon: "Flag" },
  { slug: "camisetas", name: "Camisetas", description: "Camisetas estampadas com sua arte em tecido confortável e durável.", icon: "Shirt" },
  { slug: "canecas", name: "Canecas", description: "Canecas em cerâmica com impressão sublimática de longa duração.", icon: "Coffee" },
  { slug: "brindes", name: "Brindes Corporativos", description: "Kits e brindes personalizados para empresas e eventos.", icon: "Gift" },
  { slug: "cartoes", name: "Cartões de Visita", description: "Cartões de visita com acabamento premium em diversos formatos.", icon: "CreditCard" },
  { slug: "adesivos", name: "Adesivos", description: "Adesivos recortados e em rolo para identidade visual e divulgação.", icon: "Sticker" },
];

export const products: Product[] = [
  { id: "p1", slug: "caneca-personalizada-ceramica", name: "Caneca Personalizada em Cerâmica 325ml", description: "Caneca branca em cerâmica com impressão sublimática de alta resolução. Resistente a lava-louças e micro-ondas. Personalize com fotos, logos ou frases.", price: 39.9, oldPrice: 49.9, image: mug, category: "canecas", variants: [{ label: "Modelo", options: ["Branca", "Mágica", "Colorida"] }], badge: "mais-vendido", template: true },
  { id: "p2", slug: "camiseta-personalizada-algodao", name: "Camiseta Personalizada 100% Algodão", description: "Camiseta de alta gramatura com estampa em silk ou DTF. Toque macio e cores vibrantes que duram lavagem após lavagem.", price: 59.9, image: tshirt, category: "camisetas", variants: [{ label: "Tamanho", options: ["P", "M", "G", "GG", "XG"] }, { label: "Cor", options: ["Branca", "Preta", "Azul", "Vermelha"] }], badge: "novo", template: true },
  { id: "p3", slug: "quadro-canvas-moldura-dourada", name: "Quadro Canvas com Moldura Dourada 40x60", description: "Impressão em tela canvas premium com moldura em madeira dourada. Acompanha sistema de fixação pronto para instalar.", price: 189.9, oldPrice: 229.9, image: canvas, category: "quadros", variants: [{ label: "Tamanho", options: ["30x40", "40x60", "60x90"] }], badge: "promo", template: true },
  { id: "p4", slug: "banner-lona-personalizado", name: "Banner em Lona Personalizada", description: "Banner em lona 440g impressão digital de alta qualidade, ideal para eventos, lojas e divulgação.", price: 119.0, image: banner, category: "banners", variants: [{ label: "Tamanho", options: ["1m x 0,5m", "2m x 1m", "3m x 1,5m"] }], template: true },
  { id: "p5", slug: "kit-brindes-corporativos-premium", name: "Kit Brinde Corporativo Premium", description: "Kit composto por caderno capa dura, caneta metálica e ecobag personalizados com a identidade visual da sua empresa.", price: 89.9, image: brindes, category: "brindes", badge: "novo" },
  { id: "p6", slug: "cartoes-visita-laminados", name: "Cartões de Visita Laminados (1000 un.)", description: "1000 cartões em couché 300g com laminação fosca ou brilhosa. Acabamento profissional para sua marca.", price: 149.0, oldPrice: 179.0, image: cards, category: "cartoes", variants: [{ label: "Acabamento", options: ["Fosco", "Brilho", "Verniz Localizado"] }], badge: "mais-vendido" },
  { id: "p7", slug: "adesivos-recortados-vinil", name: "Adesivos Recortados em Vinil", description: "Adesivos personalizados em vinil de alta durabilidade, resistentes a água e sol. Ideais para personalizar produtos.", price: 34.9, image: adesivos, category: "adesivos", variants: [{ label: "Quantidade", options: ["50 un.", "100 un.", "250 un.", "500 un."] }], template: true },
  { id: "p8", slug: "caneca-magica-personalizada", name: "Caneca Mágica Personalizada", description: "Caneca preta que revela a estampa com bebida quente. Surpreenda com presentes únicos e divertidos.", price: 49.9, image: mug, category: "canecas", badge: "novo", template: true },
  { id: "p9", slug: "camiseta-evento-personalizada", name: "Camiseta para Eventos e Times", description: "Camiseta ideal para uniformes, equipes e eventos corporativos. Estampa frente e verso inclusa.", price: 54.9, image: tshirt, category: "camisetas", variants: [{ label: "Tamanho", options: ["P", "M", "G", "GG"] }], template: true },
  { id: "p10", slug: "quadro-decorativo-trio", name: "Quadro Decorativo Trio Personalizado", description: "Conjunto de 3 quadros que se complementam, perfeitos para sala, quarto ou escritório.", price: 249.9, image: canvas, category: "quadros", badge: "mais-vendido", template: true },
  { id: "p11", slug: "banner-roll-up", name: "Banner Roll-Up Profissional", description: "Banner Roll-Up estrutura em alumínio com bolsa de transporte. Montagem rápida em qualquer ambiente.", price: 289.0, image: banner, category: "banners" },
  { id: "p12", slug: "cartao-visita-premium-dourado", name: "Cartão de Visita Premium Dourado", description: "Cartões com hot stamping dourado, papel especial 350g e acabamento que impressiona.", price: 219.0, image: cards, category: "cartoes", badge: "promo" },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductsByCategory = (cat: string) => products.filter((p) => p.category === cat);
