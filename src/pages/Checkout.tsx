import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { toast } from "sonner";

const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const nav = useNavigate();
  const [cep, setCep] = useState("");
  const [shipping, setShipping] = useState<{ label: string; price: number; days: string } | null>(null);
  const [payment, setPayment] = useState("pix");
  const [submitting, setSubmitting] = useState(false);

  const calcShipping = () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      toast.error("Informe um CEP válido (8 dígitos).");
      return;
    }
    // Mock: cálculo provisório baseado na origem em São Bernardo do Campo - SP.
    // Será substituído por integração real (Correios / Melhor Envio) na próxima fase.
    const base = 18 + Math.round((parseInt(clean.slice(0, 3), 10) % 50) * 0.6);
    setShipping({ label: "Entrega padrão", price: base, days: "5 a 10 dias úteis" });
    toast.success("Frete calculado!");
  };

  const total = subtotal + (shipping?.price || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping) { toast.error("Calcule o frete antes de continuar."); return; }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Pedido enviado! Entraremos em contato em breve.");
      clear();
      nav("/");
    }, 800);
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
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          <Section icon={<MapPin className="h-5 w-5" />} title="Endereço de entrega">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nome completo" name="name" required />
              <Field label="CPF" name="cpf" required />
              <Field label="E-mail" name="email" type="email" required />
              <Field label="Telefone / WhatsApp" name="phone" required />
              <div className="sm:col-span-2 flex gap-2 items-end">
                <Field label="CEP" value={cep} onChange={(e) => setCep(e.target.value)} required wrapperClass="flex-1" />
                <Button type="button" variant="outline" onClick={calcShipping}>Calcular</Button>
              </div>
              <Field label="Endereço" name="address" wrapperClass="sm:col-span-2" required />
              <Field label="Número" name="number" required />
              <Field label="Complemento" name="complement" />
              <Field label="Bairro" name="district" required />
              <Field label="Cidade" name="city" required />
              <Field label="Estado" name="state" required />
            </div>
          </Section>

          <Section icon={<Truck className="h-5 w-5" />} title="Frete">
            {shipping ? (
              <div className="flex items-center justify-between p-4 rounded-md border border-primary bg-primary/5">
                <div>
                  <p className="font-semibold">{shipping.label}</p>
                  <p className="text-xs text-muted-foreground">{shipping.days} • origem: São Bernardo do Campo - SP</p>
                </div>
                <p className="font-bold text-primary">{formatBRL(shipping.price)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Informe o CEP acima e clique em Calcular.</p>
            )}
          </Section>

          <Section icon={<CreditCard className="h-5 w-5" />} title="Forma de pagamento">
            <div className="space-y-2">
              {[
                { v: "pix", label: "PIX (5% de desconto)" },
                { v: "credit", label: "Cartão de Crédito (em até 6x sem juros)" },
                { v: "boleto", label: "Boleto Bancário" },
              ].map((p) => (
                <label key={p.v} className={`flex items-center gap-3 p-4 rounded-md border cursor-pointer transition-smooth ${payment === p.v ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                  <input type="radio" name="payment" value={p.v} checked={payment === p.v} onChange={() => setPayment(p.v)} className="accent-primary" />
                  <span className="text-sm font-medium">{p.label}</span>
                </label>
              ))}
              <p className="text-xs text-muted-foreground mt-2">Integração com gateway de pagamento (Stripe / MercadoPago) será habilitada em breve.</p>
            </div>
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
            <CheckCircle2 className="h-5 w-5" /> {submitting ? "Enviando..." : "Confirmar pedido"}
          </Button>
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
    <input
      {...props}
      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

export default Checkout;
