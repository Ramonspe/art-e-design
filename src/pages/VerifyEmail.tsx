import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const email = params.get("email") ?? "";
  const redirect = params.get("redirect") || "/conta";
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = token.replace(/\D/g, "");
    if (code.length < 6) { toast.error("Informe o código recebido por e-mail."); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "signup" });
    setBusy(false);
    if (error) { toast.error(error.message || "Não foi possível confirmar o e-mail."); return; }
    toast.success("E-mail confirmado. Sua conta está pronta!");
    nav(redirect, { replace: true });
  };

  const resend = async () => {
    if (!email) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) { toast.error(error.message || "Não foi possível reenviar o código."); return; }
    toast.success("Enviamos um novo código.");
  };

  if (!email) return <div className="container py-16 max-w-md"><p>O e-mail para confirmação não foi informado.</p><Button asChild className="mt-4"><Link to="/auth">Voltar ao cadastro</Link></Button></div>;

  return <div className="container py-16 max-w-md"><div className="rounded-2xl border border-border bg-card p-8 shadow-card-soft">
    <h1 className="text-2xl font-bold">Confirme seu e-mail</h1>
    <p className="mt-2 text-sm text-muted-foreground">Enviamos um código para <strong className="text-foreground">{email}</strong>. Informe-o para ativar a conta.</p>
    <form onSubmit={verify} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Código de confirmação
        <input value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-center text-lg tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-ring" />
      </label>
      <Button type="submit" variant="cta" className="w-full" disabled={busy || token.length < 6}>{busy ? "Aguarde..." : "Confirmar e-mail"}</Button>
    </form>
    <button type="button" onClick={resend} disabled={busy} className="mt-4 w-full text-sm font-semibold text-primary hover:underline disabled:opacity-50">Reenviar código</button>
  </div></div>;
};

export default VerifyEmail;
