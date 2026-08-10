import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/contexts/CartContext";

const statusLabel: Record<string, string> = {
  pendente: "Pendente", confirmado: "Confirmado", em_producao: "Em produção",
  enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado",
};
const statusColor: Record<string, string> = {
  pendente: "bg-muted text-foreground", confirmado: "bg-secondary/10 text-secondary",
  em_producao: "bg-accent/20 text-accent-foreground", enviado: "bg-primary/10 text-primary",
  entregue: "bg-green-100 text-green-800", cancelado: "bg-destructive/10 text-destructive",
};

const Account = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false); });
  }, [user]);

  return (
    <div className="container py-10 max-w-5xl">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Minha conta</h1>
          <p className="text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button asChild variant="gold"><Link to="/admin">Painel admin</Link></Button>}
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /> Sair</Button>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Meus pedidos</h2>
      {loading ? <p className="text-muted-foreground">Carregando…</p> :
       orders.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p>
          <Button asChild variant="cta" className="mt-4"><Link to="/produtos">Comprar agora</Link></Button>
        </div>
       ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold">Pedido #{o.order_number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")} • {o.order_items.length} {o.order_items.length === 1 ? "item" : "itens"}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
                <p className="font-bold text-primary">{formatBRL(Number(o.total))}</p>
              </div>
              <div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Pagamento: <strong className="text-foreground">{o.payment_method}</strong></div>
                <div>Frete: <strong className="text-foreground">{o.shipping_method || "—"}</strong></div>
                <div>Entrega: <strong className="text-foreground">{o.shipping_city}/{o.shipping_state}</strong></div>
                {o.superfrete_tracking_code && <div>Rastreio: <strong className="text-foreground">{o.superfrete_tracking_code}</strong></div>}
              </div>
            </div>
          ))}
        </div>
       )}
    </div>
  );
};

export default Account;
