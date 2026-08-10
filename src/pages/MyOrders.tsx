import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"] & { order_items: Array<Database["public"]["Tables"]["order_items"]["Row"]> };

const statusLabel: Record<string, string> = { pendente: "Pendente", confirmado: "Confirmado", em_producao: "Em produção", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
const statusColor: Record<string, string> = { pendente: "bg-muted text-foreground", confirmado: "bg-secondary/10 text-secondary", em_producao: "bg-accent/20 text-accent-foreground", enviado: "bg-primary/10 text-primary", entregue: "bg-green-100 text-green-800", cancelado: "bg-destructive/10 text-destructive" };

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    });
  }, [user]);

  return <div className="container py-10 max-w-5xl"><div className="flex items-start justify-between gap-4 mb-8 flex-wrap"><div><h1 className="text-3xl font-bold">Meus pedidos</h1><p className="text-muted-foreground mt-1">Acompanhe suas compras e entregas.</p></div><Button asChild variant="outline"><Link to="/conta">Minha conta</Link></Button></div>
    {loading ? <p className="text-muted-foreground">Carregando…</p> : orders.length === 0 ? <div className="text-center py-16 rounded-xl border border-dashed border-border"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p><Button asChild variant="cta" className="mt-4"><Link to="/produtos">Comprar agora</Link></Button></div> : <div className="space-y-3">{orders.map((order) => <div key={order.id} className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between flex-wrap gap-3"><div><p className="font-bold">Pedido #{order.order_number}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")} · {order.order_items.length} {order.order_items.length === 1 ? "item" : "itens"}</p></div><span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status]}`}>{statusLabel[order.status]}</span><p className="font-bold text-primary">{formatBRL(Number(order.total))}</p></div><div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground"><div>Pagamento: <strong className="text-foreground">{order.payment_method}</strong></div><div>Frete: <strong className="text-foreground">{order.shipping_method || "—"}</strong></div><div>Entrega: <strong className="text-foreground">{order.shipping_city}/{order.shipping_state}</strong></div>{order.superfrete_tracking_code && <div>Rastreio: <strong className="text-foreground">{order.superfrete_tracking_code}</strong></div>}</div></div>)}</div>}
  </div>;
};

export default MyOrders;
