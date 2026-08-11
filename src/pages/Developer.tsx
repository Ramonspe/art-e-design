import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DeveloperEvent = {
  id: string;
  created_at: string;
  source: string;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  reference_id: string;
};

const Developer = () => {
  const [events, setEvents] = useState<DeveloperEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("developer_events")
      .select("id,created_at,source,severity,code,message,reference_id")
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) {
      toast.error("Não foi possível carregar os diagnósticos.", { description: "Confirme se a migration de desenvolvedor foi aplicada." });
      return;
    }
    setEvents(data as DeveloperEvent[]);
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Painel de desenvolvimento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Diagnósticos técnicos da loja, sem expor tokens, senhas ou dados pessoais de clientes.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Eventos recentes</p><p className="mt-2 text-3xl font-bold text-primary">{events.length}</p></div>
        <div className="rounded-xl border border-border bg-card p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Acesso protegido</div><p className="mt-2 text-sm text-muted-foreground">Os eventos mostram etapa, código e referência de suporte. Segredos e informações de pagamento não são registrados.</p></div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5"><h2 className="font-bold">Diagnósticos recentes</h2><p className="mt-1 text-sm text-muted-foreground">Use o código de referência para localizar a ocorrência no suporte.</p></div>
        {loading ? <p className="p-5 text-muted-foreground">Carregando…</p> : events.length === 0 ? <p className="p-10 text-center text-muted-foreground">Nenhum diagnóstico registrado.</p> : (
          <table className="min-w-[780px] w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase"><tr><th className="p-3 text-left">Data</th><th className="p-3 text-left">Origem</th><th className="p-3 text-left">Código</th><th className="p-3 text-left">Mensagem</th><th className="p-3 text-left">Referência</th></tr></thead>
            <tbody>{events.map((event) => <tr key={event.id} className="border-t border-border"><td className="p-3 text-muted-foreground">{new Date(event.created_at).toLocaleString("pt-BR")}</td><td className="p-3"><span className="inline-flex items-center gap-1"><AlertTriangle className={`h-3.5 w-3.5 ${event.severity === "error" ? "text-destructive" : "text-primary"}`} />{event.source}</span></td><td className="p-3 font-mono text-xs">{event.code}</td><td className="p-3">{event.message}</td><td className="p-3 font-mono text-xs text-muted-foreground">{event.reference_id}</td></tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Developer;
