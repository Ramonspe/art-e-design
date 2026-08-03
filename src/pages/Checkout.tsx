import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchAddressByCep, quoteShipping, type ShippingQuote } from "@/lib/shipping";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(8).max(30),
  customer_cpf: z.string().trim().max(20).optional(),
  shipping_cep: z.string().trim().min(8).max(9),
  shipping_street: z.string().trim().min(2).max(200),
  shipping_number: z.string().trim().min(1).max(20),
  shipping_complement: z.string().trim().max(120).optional(),
  shipping_district: z.string().trim().min(2).max(120),
  shipping_city: z.string().trim().min(2).max(120),
  shipping_state: z.string().trim().min(2).max(2),
  notes: z.string().trim().max(500).optional(),
});

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({
    customer_name: "", customer_email: user?.email || "", customer_phone: "", customer_cpf: "",
    shipping_cep: "", shipping_street: "", shipping_number: "", shipping_complement: "",
    shipping_district: "", shipping_city: "", shipping_state: "", notes: "",
  });
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => { if (user?.email) setForm((f) => ({ ...f, customer_email: user.email! })); }, [user]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onCepBlur = async () => {
    const c = form.shipping_cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    setCepLoading(true);
    try {
      const addr = await fetchAddressByCep(c);
      setForm((f) => ({ ...f, shipping_street: f.shipping_street || addr.street, shipping_district: f.shipping_district || addr.district, shipping_city: addr.city, shipping_state: addr.state }));
      const q = await quoteShipping(c);
      if (q) { setShipping(q); toast.success(`Frete: ${q.label}`); }
      else { setShipping(null); toast.error("Não atendemos esse CEP no momento."); }
    } catch (e: any) { toast.error(e.message); }
    finally { setCepLoading(false); }
  };

  const shippingPrice = shipping?.price ?? 0;
  const total = subtotal + shippingPrice;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping) { toast.error("Calcule o frete (digite o CEP e saia do campo)."); return; }
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    // Abra a guia ainda durante o gesto do usuário para evitar que o navegador
    // bloqueie o popup depois da chamada assíncrona ao Mercado Pago.
    const paymentTab = window.open("about:blank", "_blank");
    if (!paymentTab) {
      toast.error("Não foi possível abrir a guia de pagamento.", {
        description: "Permita pop-ups para este site e tente novamente.",
      });
      return;
    }

    paymentTab.opener = null;
    setSubmitting(true);
    try {
      // O pedido é criado no servidor (edge function com service_role) para funcionar
      // também na compra como convidado, e a preferência do Mercado Pago é gerada na
      // mesma chamada. O JWT do usuário logado (se houver) é enviado automaticamente.
      toast.loading("Redirecionando para o pagamento seguro...", { id: "mp" });
      const { data: mp, error: mpErr } = await supabase.functions.invoke("create-mp-preference", {
        body: {
          order: {
            customer_name: parsed.data.customer_name,
            customer_email: parsed.data.customer_email,
            customer_phone: parsed.data.customer_phone,
            customer_cpf: parsed.data.customer_cpf || null,
            shipping_cep: parsed.data.shipping_cep,
            shipping_street: parsed.data.shipping_street,
            shipping_number: parsed.data.shipping_number,
            shipping_complement: parsed.data.shipping_complement || null,
            shipping_district: parsed.data.shipping_district,
            shipping_city: parsed.data.shipping_city,
            shipping_state: parsed.data.shipping_state,
            shipping_method: shipping.label,
            shipping_cost: shippingPrice,
            notes: parsed.data.notes || null,
          },
          items: items.map((i) => ({
            product_id: i.productId,
            product_name: i.name,
            product_image: i.image,
            variant: i.variant || null,
            unit_price: i.price,
            quantity: i.quantity,
          })),
        },
      });

      if (mpErr || !mp?.init_point) {
        toast.dismiss("mp");
        if (mp?.order_number) {
          toast.success(`Pedido #${mp.order_number} registrado!`, { description: "Entraremos em contato pelo WhatsApp." });
          clear();
          nav(user ? "/conta" : "/");
          return;
        }
        throw new Error(mpErr?.message || (mp as any)?.error || "Não foi possível iniciar o pagamento.");
      }

      clear();
      toast.dismiss("mp");
      paymentTab.location.replace(mp.init_point);
    } catch (err: any) {
      paymentTab.close();
      toast.dismiss("mp");
      toast.error("Erro ao registrar pedido", { description: err.message });
    } finally { setSubmitting(false); }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p>Seu carrinho está vazio.</p>
        <Button asChild variant="cta" className="mt-4"><Link to="/produtos">Ver produtos</Link></Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

      {!user && (
        <div className="mb-6 rounded-lg border border-secondary/30 bg-secondary/5 p-4 text-sm">
          <strong>Comprando como convidado.</strong> Para acompanhar seus pedidos, <Link to="/auth?redirect=/checkout" className="text-secondary font-semibold hover:underline">crie uma conta ou entre</Link>.
        </div>
      )}
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          <Section icon={<MapPin className="h-5 w-5" />} title="Endereço de entrega">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome completo" value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} required />
              <Field label="CPF" value={form.customer_cpf} onChange={(e) => set("customer_cpf", e.target.value)} />
              <Field label="E-mail" type="email" value={form.customer_email} onChange={(e) => set("customer_email", e.target.value)} required />
              <Field label="Telefone / WhatsApp" value={form.customer_phone} onChange={(e) => set("customer_phone", e.target.value)} required />
              <Field label={cepLoading ? "CEP (buscando…)" : "CEP"} value={form.shipping_cep} onChange={(e) => set("shipping_cep", e.target.value)} onBlur={onCepBlur} required />
              <div />
              <Field label="Endereço" value={form.shipping_street} onChange={(e) => set("shipping_street", e.target.value)} wrapperClass="sm:col-span-2" required />
              <Field label="Número" value={form.shipping_number} onChange={(e) => set("shipping_number", e.target.value)} required />
              <Field label="Complemento" value={form.shipping_complement} onChange={(e) => set("shipping_complement", e.target.value)} />
              <Field label="Bairro" value={form.shipping_district} onChange={(e) => set("shipping_district", e.target.value)} required />
              <Field label="Cidade" value={form.shipping_city} onChange={(e) => set("shipping_city", e.target.value)} required />
              <Field label="Estado (UF)" maxLength={2} value={form.shipping_state} onChange={(e) => set("shipping_state", e.target.value.toUpperCase())} required />
            </div>
          </Section>

          <Section icon={<Truck className="h-5 w-5" />} title="Frete">
            {shipping ? (
              <div className="flex items-center justify-between rounded-md border border-primary bg-primary/5 p-4">
                <div>
                  <p className="font-semibold">{shipping.label}</p>
                  <p className="text-xs text-muted-foreground">{shipping.days} • origem: São Bernardo do Campo - SP</p>
                </div>
                <p className="font-bold text-primary">{formatBRL(shipping.price)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Informe o CEP acima para calcular o frete automaticamente.</p>
            )}
          </Section>

          <Section icon={<CreditCard className="h-5 w-5" />} title="Pagamento seguro via Mercado Pago">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm space-y-2">
              <p className="font-semibold">Você será redirecionado para o ambiente seguro do Mercado Pago para escolher:</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li><strong>PIX</strong> — aprovação imediata</li>
                <li><strong>Cartão de Crédito</strong></li>
                <li><strong>Boleto Bancário</strong></li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">Ao confirmar o pedido, o link de pagamento é gerado automaticamente. Seus dados de cartão não passam pelo nosso site.</p>
            </div>
          </Section>


          <Section icon={<MapPin className="h-5 w-5" />} title="Observações (opcional)">
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} maxLength={500} className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Detalhes da personalização, prazo, etc." />
          </Section>
        </div>

        <aside className="h-fit p-6 rounded-xl border border-border bg-card sticky top-28">
          <h2 className="font-bold text-lg mb-4">Resumo</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-auto">
            {items.map((i) => (
              <div key={`${i.productId}-${i.variant}`} className="flex gap-3 text-sm">
                <img src={i.image} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="line-clamp-2 text-xs">{i.name}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {i.quantity}</p>
                </div>
                <p className="font-semibold text-xs">{formatBRL(i.price * i.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between"><span>Frete</span><span>{shipping ? formatBRL(shipping.price) : "—"}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span><span className="text-primary">{formatBRL(total)}</span>
            </div>
          </div>
          <Button type="submit" variant="cta" size="lg" className="w-full mt-6" disabled={submitting}>
            <CheckCircle2 className="h-5 w-5" /> {submitting ? "Processando..." : "Pagar com Mercado Pago"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">🔒 Ambiente 100% seguro. Você será redirecionado.</p>
        </aside>
      </div>
    </form>
  );
};

const Section = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <section className="rounded-xl border border-border bg-card p-6">
    <h2 className="flex items-center gap-2 font-bold mb-5 text-lg"><span className="text-primary">{icon}</span> {title}</h2>
    {children}
  </section>
);

const Field = ({ label, wrapperClass = "", ...props }: { label: string; wrapperClass?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={wrapperClass}>
    <label className="text-xs font-medium mb-1 block">{label}</label>
    <input {...props} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);

export default Checkout;
