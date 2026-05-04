import mug from "@/assets/prod-mug.jpg";
import tshirt from "@/assets/prod-tshirt.jpg";
import canvas from "@/assets/prod-canvas.jpg";
import banner from "@/assets/prod-banner.jpg";
import brindes from "@/assets/prod-brindes.jpg";
import cards from "@/assets/prod-cards.jpg";
import adesivos from "@/assets/prod-adesivos.jpg";

const map: Record<string, string> = {
  "prod-mug": mug,
  "prod-tshirt": tshirt,
  "prod-canvas": canvas,
  "prod-banner": banner,
  "prod-brindes": brindes,
  "prod-cards": cards,
  "prod-adesivos": adesivos,
};

export const resolveImage = (key?: string | null): string => {
  if (!key) return mug;
  if (key.startsWith("http") || key.startsWith("/") || key.startsWith("data:")) return key;
  return map[key] || mug;
};
