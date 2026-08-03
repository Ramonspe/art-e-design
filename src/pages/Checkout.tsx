import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, CreditCard, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL, useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { BRAZILIAN_STATES, cleanDigits, formatCep, formatCpf, formatPhone, isValidBrazilianPhone, isValidCpf } from "@/lib/checkout";
import { fetchAddressByCep, quoteShipping, type ShippingQuote } from "@/lib/shipping";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().refine(isValidBrazilianPhone, "Informe um telefone brasileiro válido."),
  customer_cpf: z.string().trim().refine(isValidCpf, "Informe um CPF válido."),
  shipping_cep: z.string().trim().refine((cep) => cleanDigits(cep).length === 8, "Informe um CEP válido."),
  shipping_street: z.string().trim().min(2).max(200),
  shipping_number: z.string().trim().min(1).max(20),
  shipping_complement: z.string().trim().max(120).optional(),
  shipping_district: z.string().trim().min(2).max(120),
  shipping_city: z.string().trim().min(2).max(120),
  shipping_state: z.string().trim().refine((state) => BRAZILIAN_STATES.includes(state as typeof BRAZILIAN_STATES[number]), "Selecione uma UF válida."),
  notes: z.string().trim().max(500).optional(),
});

const Checkout = () => {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState<Record<string, string>>({
    customer_name: "", customer_email: user?.email || "", customer_phone: "", customer_cpf: "",
    shipping_cep: "", shipping_street: "", shipping_number: "", shipping_complement: "",
    shipping_district: "", shipping_city: "", shipping_state: "", notes: "",
  });
  const [shipping, setShipping] = useState<ShippingQuote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    if (user?.email) setForm((current) => ({ ...current, customer_email: user.email! }));
  }, [user]);

  const paymentWasNotCompleted = params.get("erro") === "pagamento";

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const onCepBlur = async () => {
    const cep = cleanDigits(form.shipping_cep);
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const address = await fetchAddressByCep(cep);
      setForm((current) => ({
        ...current,
        shipping_street: current.shipping_street || address.street,
        shipping_district: current.shipping_district || address.district,
        shipping_city: address.city,
        shipping_state: address.state,
      }));
      const quote = await quoteShipping(cep);
      if (quote) {
        setShipping(quote);
        toast.success(`Frete: ${quote.label}`);
      } else {
        setShipping(null);
        toast.error("Não atendemos esse CEP no momento.");
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!shipping) {
      toast.error("Calcule o frete informando um CEP válido.");
      return;
    }

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Revise os dados do pedido.");
      return;
    }

    setSubmitting(true);
    try {
      toast.loading("Criando seu protocolo de pagamento…", { id: "mp" });
      const { data: payment, error: paymentError } = await supabase.functions.invoke("create-mp-preference", {
        body: {
          order: {
            customer_name: parsed.data.customer_name,
            customer_email: parsed.data.customer_email,
            customer_phone: parsed.data.customer_phone,
            customer_cpf: cleanDigits(parsed.data.customer_cpf),
            shipping_cep: cleanDigits(parsed.data.shipping_cep),
            shipping_street: parsed.data.shipping_street,
            shipping_number: parsed.data.shipping_number,
            shipping_complement: parsed.data.shipping_complement || null,
            shipping_district: parsed.data.shipping_district,
            shipping_city: parsed.data.shipping_city,
            shipping_state: parsed.data.shipping_state,
            notes: parsed.data.notes || null,
          },
          items: items.map((item) => ({
            product_id: item.productId,
            variant: item.variant || null,
            quantity: item.quantity,
          })),
        },
      });

      toast.dismiss("mp");
      if (paymentError || !payment?.init_point) {
        throw new Error(paymentError?.message || payment?.error || "Não foi possível iniciar o pagamento.");
      }

      // O carrinho permanece salvo até a tela de confirmação receber a aprovação
      // real do webhook do Mercado Pago.
      window.location.assign(payment.init_point);
    } catch (error: unknown) {
      toast.dismiss("mp");
      toast.error("Erro ao registrar pedido", { description: error instanceof Error ? error.message : "Tente novamente em alguns instantes." });
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <p>Seu carrinho está vazio.</p>
        <Button asChild variant="cta" className="mt-4"><Link to="/produtos">Ver produtos</Link></Button>
      </div>
    );
  }

  const shippingPrice = shipping?.price ?? 0;
  const total = subtotal + shippingPrice;

  return (
    <form onSubmit={submit} className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Finalizar compra</h1>

      {!user && (
        <div className="mb-6 rounded-lg border border-secondary/30 bg-secondary/5 p-4 text-sm">
          <strong>Comprando como convidado.</strong> Para acompanhar seus pedidos, <Link to="/auth?redirect=/checkout" className="text-secondary font-semibold hover:underline">crie uma conta ou entre</Link>.
        </div>
      )}

      {paymentWasNotCompleted && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold">Pagamento não concluído.</p>
          <p className="mt-1 text-muted-foreground">Nenhuma cobrança foi confirmada e os produtos continuam no seu carrinho. Você pode tentar novamente quando quiser.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          <Section icon={<MapPin className="h-5 w-5" />} title="Endereço de entrega">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome completo" name="customer_name" autoComplete="name" value={form.customer_name} onChange={(event) => set("customer_name", event.target.value)} required />
              <Field label="CPF" name="customer_cpf" autoComplete="off" inputMode="numeric" value={form.customer_cpf} onChange={(event) => set("customer_cpf", formatCpf(event.target.value))} required />
              <Field label="E-mail" name="customer_email" autoComplete="email" type="email" value={form.customer_email} onChange={(event) => set("customer_email", event.target.value)} required />
              <Field label="Telefone / WhatsApp" name="customer_phone" autoComplete="tel" inputMode="tel" value={form.customer_phone} onChange={(event) => set("customer_phone", formatPhone(event.target.value))} required />
              <Field label={cepLoading ? "CEP (buscando…)" : "CEP"} name="shipping_cep" autoComplete="postal-code" inputMode="numeric" value={form.shipping_cep} onChange={(event) => { set("shipping_cep", formatCep(event.target.value)); setShipping(null); }} onBlur={onCepBlur} required />
              <div />
              <Field label="Endereço" name="shipping_street" autoComplete="address-line1" value={form.shipping_street} onChange={(event) => set("shipping_street", event.target.value)} wrapperClass="sm:col-span-2" required />
              <Field label="Número" name="shipping_number" autoComplete="address-line2" value={form.shipping_number} onChange={(event) => set("shipping_number", event.target.value)} required />
              <Field label="Complemento" name="shipping_complement" value={form.shipping_complement} onChange={(event) => set("shipping_complement", event.target.value)} />
              <Field label="Bairro" name="shipping_district" value={form.shipping_district} onChange={(event) => set("shipping_district", event.target.value)} required />
              <Field label="Cidade" name="shipping_city" autoComplete="address-level2" value={form.shipping_city} onChange={(event) => set("shipping_city", event.target.value)} required />
              <div>
                <label htmlFor="shipping_state" className="text-xs font-medium mb-1 block">Estado (UF)</label>
                <select id="shipping_state" name="shipping_state" autoComplete="address-level1" value={form.shipping_state} onChange={(event) => set("shipping_state", event.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" required>
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
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
            ) : <p className="text-sm text-muted-foreground">Informe um CEP válido para calcular o frete automaticamente.</p>}
          </Section>

          <Section icon={<CreditCard className="h-5 w-5" />} title="Pagamento seguro via Mercado Pago">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm space-y-2">
              <p className="font-semibold">Você será redirecionado ao Mercado Pago para escolher PIX, cartão ou boleto.</p>
              <p className="text-xs text-muted-foreground">O protocolo é gerado antes do pagamento. Nenhuma cobrança é feita até a aprovação no Mercado Pago.</p>
            </div>
          </Section>

          <Section icon={<MapPin className="h-5 w-5" />} title="Observações (opcional)">
            <label htmlFor="notes" className="sr-only">Observações</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={(event) => set("notes", event.target.value)} rows={3} maxLength={500} className="w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Detalhes da personalização, prazo, etc." />
          </Section>
        </div>

        <aside className="h-fit p-6 rounded-xl border border-border bg-card sticky top-28">
          <h2 className="font-bold text-lg mb-4">Resumo</h2>
          <div className="space-y-3 mb-4 max-h-64 overflow-auto">
            {items.map((item) => (
              <div key={`${item.productId}-${item.variant}`} className="flex gap-3 text-sm">
                <img src={item.image} alt="" className="h-12 w-12 rounded object-cover" />
                <div className="flex-1"><p className="line-clamp-2 text-xs">{item.name}</p><p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p></div>
                <p className="font-semibold text-xs">{formatBRL(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between"><span>Frete</span><span>{shipping ? formatBRL(shipping.price) : "—"}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Total</span><span className="text-primary">{formatBRL(total)}</span></div>
          </div>
          <Button type="submit" variant="cta" size="lg" className="w-full mt-6" disabled={submitting}>
            <CheckCircle2 className="h-5 w-5" /> {submitting ? "Redirecionando para o pagamento..." : "Pagar com Mercado Pago"}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-3">🔒 Ambiente seguro. Você será redirecionado.</p>
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

const Field = ({ label, wrapperClass = "", name, ...props }: { label: string; wrapperClass?: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={wrapperClass}>
    <label htmlFor={name} className="text-xs font-medium mb-1 block">{label}</label>
    <input id={name} name={name} {...props} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);

export default Checkout;
