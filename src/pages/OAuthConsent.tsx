import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

// Local wrapper for the beta supabase.auth.oauth namespace so TS doesn't complain.
type AuthOAuth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};
const authOAuth = (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("Solicitação inválida: falta authorization_id.");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?redirect=" + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await authOAuth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message ?? "Falha ao carregar autorização.");
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await authOAuth.approveAuthorization(authorizationId)
        : await authOAuth.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        return setError(error.message ?? "Falha ao registrar decisão.");
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        return setError("O servidor de autorização não retornou uma URL de redirecionamento.");
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? String(e));
    }
  }

  if (error) {
    return (
      <main className="container py-16 max-w-md">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
          <h1 className="text-xl font-bold">Não foi possível carregar esta autorização</h1>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </main>
    );
  }
  if (!details) {
    return (
      <main className="container py-16 max-w-md text-center text-sm text-muted-foreground">Carregando…</main>
    );
  }

  const clientName = details.client?.name ?? "aplicativo externo";
  const redirectUri = details.client?.redirect_uri ?? details.redirect_uri;

  return (
    <main className="container py-16 max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card-soft">
        <h1 className="text-2xl font-bold">Conectar {clientName} à sua conta</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Isso permite que <strong>{clientName}</strong> use as ferramentas do Art & Personalizados como você. As
          permissões e políticas de acesso deste app continuam valendo — só é possível ver e gerenciar os seus próprios
          pedidos e dados.
        </p>
        {redirectUri && (
          <p className="mt-4 text-xs text-muted-foreground break-all">
            Redirecionamento após aprovação: <span className="font-mono">{redirectUri}</span>
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <Button type="button" variant="cta" className="flex-1" disabled={busy} onClick={() => decide(true)}>
            Aprovar
          </Button>
          <Button type="button" variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    </main>
  );
}
