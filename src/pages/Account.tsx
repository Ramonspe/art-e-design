import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, LogOut, Package, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { formatBRL } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCep, formatCpf, formatPhone } from "@/lib/checkout";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Address = Database["public"]["Tables"]["addresses"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"] & { order_items: Array<Database["public"]["Tables"]["order_items"]["Row"]> };

const statusLabel: Record<string, string> = { pendente: "Pendente", confirmado: "Confirmado", em_producao: "Em produção", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
const statusColor: Record<string, string> = { pendente: "bg-muted text-foreground", confirmado: "bg-secondary/10 text-secondary", em_producao: "bg-accent/20 text-accent-foreground", enviado: "bg-primary/10 text-primary", entregue: "bg-green-100 text-green-800", cancelado: "bg-destructive/10 text-destructive" };

const Account = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState({ full_name: "", phone: "", cpf: "", order_updates_email_consent: false, marketing_email_consent: false });
  const [address, setAddress] = useState({ cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const [addressId, setAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileResult, addressResult, ordersResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("addresses").select("*").eq("user_id", user.id).eq("is_default", true).maybeSingle(),
        supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      const savedProfile = profileResult.data as Profile | null;
      const savedAddress = addressResult.data as Address | null;
      if (savedProfile) setProfile({ full_name: savedProfile.full_name ?? "", phone: savedProfile.phone ?? "", cpf: savedProfile.cpf ?? "", order_updates_email_consent: savedProfile.order_updates_email_consent, marketing_email_consent: savedProfile.marketing_email_consent });
      if (savedAddress) {
        setAddressId(savedAddress.id);
        setAddress({ cep: formatCep(savedAddress.cep), street: savedAddress.street, number: savedAddress.number, complement: savedAddress.complement ?? "", district: savedAddress.district, city: savedAddress.city, state: savedAddress.state });
      }
      setOrders((ordersResult.data ?? []) as Order[]);
      setLoading(false);
    };
    void load();
  }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error: profileError } = await supabase.from("profiles").update({ ...profile, cpf: profile.cpf.replace(/\D/g, "") || null }).eq("id", user.id);
    const addressPayload = { user_id: user.id, label: "Principal", is_default: true, cep: address.cep.replace(/\D/g, ""), street: address.street.trim(), number: address.number.trim(), complement: address.complement.trim() || null, district: address.district.trim(), city: address.city.trim(), state: address.state.trim().toUpperCase() };
    const addressComplete = Object.values(addressPayload).every((value) => value !== "" && value !== null) || [addressPayload.cep, addressPayload.street, addressPayload.number, addressPayload.district, addressPayload.city, addressPayload.state].every(Boolean);
    const addressResult = addressComplete ? (addressId ? await supabase.from("addresses").update(addressPayload).eq("id", addressId) : await supabase.from("addresses").insert(addressPayload).select("id").single()) : { error: null, data: null };
    setSaving(false);
    if (profileError || addressResult.error) { toast.error(profileError?.message || addressResult.error?.message || "Não foi possível salvar seus dados."); return; }
    if (!addressId && addressResult.data && "id" in addressResult.data) setAddressId(addressResult.data.id);
    toast.success("Dados salvos. Eles serão preenchidos no próximo checkout.");
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 6) { toast.error("A senha precisa ter ao menos 6 caracteres."); return; }
    if (password !== passwordConfirmation) { toast.error("As senhas não coincidem."); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); return; }
    setPassword(""); setPasswordConfirmation(""); toast.success("Senha alterada com sucesso.");
  };

  const startEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !newEmail || newEmail === user.email) { toast.error("Informe um novo e-mail válido."); return; }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { toast.error(error.message); return; }
    setNewEmail("");
    toast.success("E-mail atualizado com sucesso.");
  };

  return <div className="container py-10 max-w-5xl">
    <div className="flex items-start justify-between mb-8 gap-4 flex-wrap"><div><h1 className="text-3xl font-bold">Minha conta</h1><p className="text-muted-foreground mt-1">{user?.email}</p></div><div className="flex gap-2">{isAdmin && <Button asChild variant="gold"><Link to="/admin">Painel admin</Link></Button>}<Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /> Sair</Button></div></div>

    <div className="grid lg:grid-cols-2 gap-6 mb-10">
      <form onSubmit={saveProfile} className="rounded-xl border border-border bg-card p-6 space-y-4"><h2 className="flex items-center gap-2 text-xl font-bold"><UserRound className="h-5 w-5 text-primary" /> Meus dados</h2>
        <Input label="Nome completo" value={profile.full_name} onChange={(value) => setProfile((current) => ({ ...current, full_name: value }))} required />
        <div className="grid sm:grid-cols-2 gap-3"><Input label="Telefone" value={profile.phone} onChange={(value) => setProfile((current) => ({ ...current, phone: formatPhone(value) }))} /><Input label="CPF" value={profile.cpf} onChange={(value) => setProfile((current) => ({ ...current, cpf: formatCpf(value) }))} /></div>
        <p className="text-sm font-semibold pt-2">Endereço padrão</p><div className="grid sm:grid-cols-2 gap-3"><Input label="CEP" value={address.cep} onChange={(value) => setAddress((current) => ({ ...current, cep: formatCep(value) }))} /><Input label="Número" value={address.number} onChange={(value) => setAddress((current) => ({ ...current, number: value }))} /><Input label="Rua" wrapperClass="sm:col-span-2" value={address.street} onChange={(value) => setAddress((current) => ({ ...current, street: value }))} /><Input label="Complemento" value={address.complement} onChange={(value) => setAddress((current) => ({ ...current, complement: value }))} /><Input label="Bairro" value={address.district} onChange={(value) => setAddress((current) => ({ ...current, district: value }))} /><Input label="Cidade" value={address.city} onChange={(value) => setAddress((current) => ({ ...current, city: value }))} /><Input label="UF" value={address.state} onChange={(value) => setAddress((current) => ({ ...current, state: value.slice(0, 2).toUpperCase() }))} /></div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={profile.order_updates_email_consent} onChange={(event) => setProfile((current) => ({ ...current, order_updates_email_consent: event.target.checked }))} /> Receber atualizações dos pedidos por e-mail</label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={profile.marketing_email_consent} onChange={(event) => setProfile((current) => ({ ...current, marketing_email_consent: event.target.checked }))} /> Receber promoções e novidades por e-mail</label>
        <Button type="submit" variant="cta" disabled={saving}><Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar dados"}</Button>
      </form>
      <div className="space-y-6"><form onSubmit={changePassword} className="rounded-xl border border-border bg-card p-6 space-y-3"><h2 className="flex items-center gap-2 text-xl font-bold"><KeyRound className="h-5 w-5 text-primary" /> Trocar senha</h2><Input label="Nova senha" type="password" value={password} onChange={setPassword} minLength={6} required /><Input label="Confirmar nova senha" type="password" value={passwordConfirmation} onChange={setPasswordConfirmation} minLength={6} required /><Button type="submit" variant="outline">Atualizar senha</Button></form>
        <form onSubmit={startEmailChange} className="rounded-xl border border-border bg-card p-6 space-y-3"><h2 className="text-xl font-bold">Trocar e-mail</h2><p className="text-sm text-muted-foreground">Informe o novo endereço que deseja usar na conta.</p><Input label="Novo e-mail" type="email" value={newEmail} onChange={setNewEmail} required /><Button type="submit" variant="outline">Atualizar e-mail</Button></form>
      </div>
    </div>
    <h2 className="text-xl font-bold mb-4">Meus pedidos</h2>{loading ? <p className="text-muted-foreground">Carregando…</p> : orders.length === 0 ? <div className="text-center py-16 rounded-xl border border-dashed border-border"><Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Você ainda não fez nenhum pedido.</p><Button asChild variant="cta" className="mt-4"><Link to="/produtos">Comprar agora</Link></Button></div> : <div className="space-y-3">{orders.map((order) => <div key={order.id} className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between flex-wrap gap-3"><div><p className="font-bold">Pedido #{order.order_number}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")} · {order.order_items.length} {order.order_items.length === 1 ? "item" : "itens"}</p></div><span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status]}`}>{statusLabel[order.status]}</span><p className="font-bold text-primary">{formatBRL(Number(order.total))}</p></div><div className="mt-3 grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground"><div>Pagamento: <strong className="text-foreground">{order.payment_method}</strong></div><div>Frete: <strong className="text-foreground">{order.shipping_method || "—"}</strong></div><div>Entrega: <strong className="text-foreground">{order.shipping_city}/{order.shipping_state}</strong></div>{order.superfrete_tracking_code && <div>Rastreio: <strong className="text-foreground">{order.superfrete_tracking_code}</strong></div>}</div></div>)}</div>}
  </div>;
};

const Input = ({ label, value, onChange, wrapperClass = "", ...props }: { label: string; value: string; onChange: (value: string) => void; wrapperClass?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) => <div className={wrapperClass}><label className="text-xs font-medium mb-1 block">{label}</label><input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>;

export default Account;
