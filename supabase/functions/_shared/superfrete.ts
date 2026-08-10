type ProductForQuote = {
  name: string;
  price: number;
  quantity: number;
  shipping_weight_kg: number | null;
  shipping_height_cm: number | null;
  shipping_width_cm: number | null;
  shipping_length_cm: number | null;
};

export type SuperfreteVolume = {
  height: number;
  width: number;
  length: number;
  weight: number;
};

export type SuperfreteQuote = {
  serviceId: number;
  serviceName: string;
  price: number;
  deliveryMin: number;
  deliveryMax: number;
  volume: SuperfreteVolume;
};

type SuperfreteSender = {
  name: string;
  address: string;
  complement: string;
  number: string;
  district: string;
  city: string;
  state_abbr: string;
  postal_code: string;
  document?: string;
};

const cleanDigits = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const asPositiveNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};

function getConfig() {
  const token = Deno.env.get("SUPERFRETE_TOKEN");
  const baseUrl = (Deno.env.get("SUPERFRETE_BASE_URL") || "https://api.superfrete.com").replace(/\/$/, "");
  const originPostalCode = cleanDigits(Deno.env.get("SUPERFRETE_ORIGIN_POSTAL_CODE"));
  const userAgent = Deno.env.get("SUPERFRETE_USER_AGENT") || "Art & Design (contato@artedesign.com.br)";
  if (!token || originPostalCode.length !== 8 || !baseUrl.startsWith("https://")) {
    throw new Error("A integração SuperFrete não está configurada.");
  }
  return { token, baseUrl, originPostalCode, userAgent };
}

export function getSuperfreteSender(): SuperfreteSender {
  const postalCode = cleanDigits(Deno.env.get("SUPERFRETE_ORIGIN_POSTAL_CODE"));
  const sender: SuperfreteSender = {
    name: (Deno.env.get("SUPERFRETE_SENDER_NAME") || "").trim(),
    address: (Deno.env.get("SUPERFRETE_SENDER_ADDRESS") || "").trim(),
    complement: (Deno.env.get("SUPERFRETE_SENDER_COMPLEMENT") || "").trim(),
    number: (Deno.env.get("SUPERFRETE_SENDER_NUMBER") || "").trim(),
    district: (Deno.env.get("SUPERFRETE_SENDER_DISTRICT") || "").trim(),
    city: (Deno.env.get("SUPERFRETE_SENDER_CITY") || "").trim(),
    state_abbr: (Deno.env.get("SUPERFRETE_SENDER_STATE") || "").trim().toUpperCase(),
    postal_code: postalCode,
  };
  const document = cleanDigits(Deno.env.get("SUPERFRETE_SENDER_DOCUMENT"));
  if (document) sender.document = document;
  if (!sender.name || !sender.address || !sender.district || !sender.city || !/^[A-Z]{2}$/.test(sender.state_abbr) || sender.postal_code.length !== 8) {
    throw new Error("Os dados do remetente da SuperFrete não estão configurados.");
  }
  return sender;
}

async function request(path: string, body?: unknown) {
  const { token, baseUrl, userAgent } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("SuperFrete request failed", { path, status: response.status });
    throw new Error("Não foi possível consultar a SuperFrete.");
  }
  return payload;
}

function volumeFrom(value: unknown): SuperfreteVolume | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const dimensions = input.dimensions && typeof input.dimensions === "object"
    ? input.dimensions as Record<string, unknown>
    : input;
  const height = asPositiveNumber(dimensions.height);
  const width = asPositiveNumber(dimensions.width);
  const length = asPositiveNumber(dimensions.length);
  const weight = asPositiveNumber(input.weight);
  return height && width && length && weight ? { height, width, length, weight } : null;
}

function getPackages(input: Record<string, unknown>) {
  if (Array.isArray(input.packages)) return input.packages;
  if (Array.isArray(input.volumes)) return input.volumes;
  return [input.package, input.volume];
}

export function parseQuotes(response: unknown): SuperfreteQuote[] {
  const list = Array.isArray(response)
    ? response
    : response && typeof response === "object" && Array.isArray((response as Record<string, unknown>).data)
      ? (response as Record<string, unknown>).data as unknown[]
      : [];

  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const raw = item as Record<string, unknown>;
    const serviceId = Number(raw.id ?? raw.service_id ?? raw.service);
    const price = Number(raw.price);
    const range = raw.delivery_range && typeof raw.delivery_range === "object" ? raw.delivery_range as Record<string, unknown> : {};
    const delivery = Number(raw.delivery_time ?? raw.delivery ?? 0);
    const deliveryMin = Number(range.min ?? raw.delivery_min ?? delivery);
    const deliveryMax = Number(range.max ?? raw.delivery_max ?? delivery);
    const volume = getPackages(raw).map(volumeFrom).find((value): value is SuperfreteVolume => value !== null);
    if (!Number.isInteger(serviceId) || serviceId < 1 || !Number.isFinite(price) || price < 0 || !Number.isFinite(deliveryMin) || !Number.isFinite(deliveryMax) || !volume) return [];
    return [{
      serviceId,
      serviceName: String(raw.name ?? raw.service_name ?? `Serviço ${serviceId}`),
      price: Number(price.toFixed(2)),
      deliveryMin: Math.max(0, Math.floor(deliveryMin)),
      deliveryMax: Math.max(0, Math.floor(deliveryMax)),
      volume,
    }];
  });
}

export function validateProductDimensions(products: ProductForQuote[]) {
  for (const product of products) {
    if (!asPositiveNumber(product.shipping_weight_kg) || !asPositiveNumber(product.shipping_height_cm) || !asPositiveNumber(product.shipping_width_cm) || !asPositiveNumber(product.shipping_length_cm)) {
      throw new Error(`O produto ${product.name} está sem peso ou dimensões de envio.`);
    }
  }
}

export async function calculateSuperfrete(products: ProductForQuote[], destinationPostalCode: string): Promise<SuperfreteQuote[]> {
  validateProductDimensions(products);
  const { originPostalCode } = getConfig();
  const destination = cleanDigits(destinationPostalCode);
  if (destination.length !== 8) throw new Error("CEP de destino inválido.");

  const declaredValue = Number(products.reduce((total, product) => total + product.price * product.quantity, 0).toFixed(2));
  const services = Deno.env.get("SUPERFRETE_SERVICES") || "1,2,17,3,33";
  const useInsurance = Deno.env.get("SUPERFRETE_USE_INSURANCE") !== "false";
  const response = await request("/api/v0/calculator", {
    from: { postal_code: originPostalCode },
    to: { postal_code: destination },
    services,
    options: {
      own_hand: false,
      receipt: false,
      insurance_value: declaredValue,
      use_insurance_value: useInsurance,
    },
    products: products.map((product) => ({
      quantity: product.quantity,
      height: product.shipping_height_cm,
      width: product.shipping_width_cm,
      length: product.shipping_length_cm,
      weight: product.shipping_weight_kg,
    })),
  });
  return parseQuotes(response);
}

export async function createSuperfreteShipment(input: {
  orderNumber: number;
  subtotal: number;
  serviceId: number;
  volume: SuperfreteVolume;
  recipient: { name: string; email: string; phone: string; document: string; address: string; number: string; complement: string | null; district: string; city: string; state: string; postalCode: string };
  products: Array<{ name: string; quantity: number; unitPrice: number }>;
}) {
  const useInsurance = Deno.env.get("SUPERFRETE_USE_INSURANCE") !== "false";
  return await request("/api/v0/cart", {
    from: getSuperfreteSender(),
    to: {
      name: input.recipient.name,
      email: input.recipient.email,
      phone: cleanDigits(input.recipient.phone),
      document: cleanDigits(input.recipient.document),
      address: input.recipient.address,
      number: input.recipient.number,
      complement: input.recipient.complement || "",
      district: input.recipient.district,
      city: input.recipient.city,
      state_abbr: input.recipient.state,
      postal_code: cleanDigits(input.recipient.postalCode),
    },
    service: input.serviceId,
    products: input.products.map((product) => ({ name: product.name, quantity: product.quantity, unitary_value: product.unitPrice })),
    volumes: input.volume,
    options: {
      insurance_value: useInsurance ? input.subtotal : null,
      receipt: false,
      own_hand: false,
      non_commercial: true,
    },
    tag: String(input.orderNumber),
    platform: "Art & Design",
  });
}
