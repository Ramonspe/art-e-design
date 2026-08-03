import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, useCart } from "@/contexts/CartContext";
import { openWhatsApp } from "@/data/contact";
import { getPaymentFeedback } from "@/lib/order-payment";

const statusInfo = (paymentStatus?: string | null, orderStatus?: string) => {
  const feedback = getPaymentFeedback(paymentStatus, orderStatus);
  if (feedback === "approved") return { icon: CheckCircle2, color: "text-secondary", bg: "bg-secondary/10 border-secondary", title: "Pagamento aprovado!", desc: "Recebemos seu pagamento. Já estamos preparando seu pedido." };
  if (feedback === "rejected") return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive", title: "Pagamento não concluído", desc: "Seu pagamento não foi aprovado. Você pode tentar novamente." };
  return { icon: Clock, color: "text-primary", bg: "bg-primary/10 border-primary", title: "Aguardando confirmação do pagamento", desc: "Se você pagou por PIX ou boleto, a confirmação chega em minutos. Você receberá um e-mail assim que aprovado." };
};

const OrderConfirmation = () => {
  const [params] = useSearchParams();
  const orderId = params.get("order");
  const { clear } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    let attempts = 0;
    const loadOrder = async () => {
      // Usa a edge function para funcionar também na compra como convidado
      // (o RLS só permite o próprio usuário ler seus pedidos).
      const { data } = await supabase.functions.invoke("get-order", {
        body: { order_id: orderId },
      });
      const nextOrder = data?.order ?? null;
      setOrder(nextOrder);
      setLoading(false);
      if (nextOrder?.payment_status === "approved") {
        clear();
        clearInterval(timer);
      }
    };
    void loadOrder();
    const timer = setInterval(() => {
      attempts += 1;
      if (attempts >= 10) {
        clearInterval(timer);
        return;
      }
      void loadOrder();
    }, 3000);
    return () => clearInterval(timer);
  }, [orderId, clear]);

  if (loading) return <div className="container py-20 text-center">Carregando…</div>;

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
        <Button asChild variant="cta"><Link to="/">Voltar ao início</Link></Button>
      </div>
    );
  }

  // A URL de retorno não é prova de pagamento. A confirmação exibida vem
  // exclusivamente do pedido atualizado pelo webhook do Mercado Pago.
  const info = statusInfo(order.payment_status, order.status);
  const Icon = info.icon;

  return (
    <div className="container py-14 max-w-2xl">
      <div className={`rounded-2xl border-2 ${info.bg} p-8 text-center mb-6`}>
        <Icon className={`h-16 w-16 mx-auto mb-4 ${info.color}`} />
        <h1 className="text-2xl font-bold mb-2">{info.title}</h1>
        <p className="text-muted-foreground">{info.desc}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Nº do pedido</span>
          <span className="font-bold">#{order.order_number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-primary">{formatBRL(Number(order.total))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Entrega</span>
          <span>{order.shipping_city} - {order.shipping_state}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Status do pagamento</span>
          <span className="font-semibold capitalize">{order.payment_status || "pendente"}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => openWhatsApp(`Olá! Acabei de fazer o pedido #${order.order_number} no site. Poderia me atualizar?`)}
        >
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </Button>
        <Button asChild variant="cta" className="flex-1">
          <Link to="/produtos">Continuar comprando</Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderConfirmation;
