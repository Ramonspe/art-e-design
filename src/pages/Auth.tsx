import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
});
const signupSchema = loginSchema.extend({
  full_name: z.string().trim().min(2, "Informe seu nome").max(100),
});

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [params] = useSearchParams();
  const nav = useNavigate();
  const redirect = params.get("redirect") || "/";
  const { user } = useAuth();

  useEffect(() => { if (user) nav(redirect, { replace: true }); }, [user, redirect, nav]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget).entries());
    setBusy(true);
    try {
      if (mode === "signup") {
        const p = signupSchema.safeParse(fd);
        if (!p.success) { toast.error(p.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: p.data.email,
          password: p.data.password,
          options: { emailRedirectTo: window.location.origin + redirect, data: { full_name: p.data.full_name } },
        });
        if (error) throw error;
        toast.success("Conta criada! Você já está logado.");
      } else {
        const p = loginSchema.safeParse(fd);
        if (!p.success) { toast.error(p.error.issues[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message || "Falha na autenticação");
    } finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + redirect });
    if (r.error) { toast.error("Falha ao entrar com Google"); setBusy(false); }
  };

  return (
    <div className="container py-16 max-w-md">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-card-soft">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "login" ? "Acesse seus pedidos e perfil." : "Crie sua conta para acompanhar seus pedidos."}
        </p>

        <Button type="button" variant="outline" className="w-full mt-6" onClick={google} disabled={busy}>
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
          Continuar com Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> ou <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && <Input label="Nome completo" name="full_name" required />}
          <Input label="E-mail" name="email" type="email" required />
          <Input label="Senha" name="password" type="password" required minLength={6} />
          <Button type="submit" variant="cta" size="lg" className="w-full mt-2" disabled={busy}>
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="text-sm text-center mt-5 text-muted-foreground">
          {mode === "login" ? (
            <>Não tem conta? <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">Cadastre-se</button></>
          ) : (
            <>Já tem conta? <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Entrar</button></>
          )}
        </p>
        <p className="text-xs text-center mt-4">
          <Link to="/checkout" className="text-muted-foreground hover:text-primary">Continuar como convidado →</Link>
        </p>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="text-xs font-medium mb-1 block">{label}</label>
    <input {...props} className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
  </div>
);

export default Auth;
