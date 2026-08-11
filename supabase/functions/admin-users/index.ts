import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

type Action = "list" | "set_admin" | "set_developer";

async function requireAdmin(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) throw new Response("Unauthorized", { status: 401 });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) throw new Response("Unauthorized", { status: 401 });

  const { data: role } = await admin
    .from("user_roles")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Response("Forbidden", { status: 403 });
  return { admin, callerId: authData.user.id };
}

async function listAllUsers(admin: ReturnType<typeof createClient>) {
  const users = [] as Array<{ id: string; email?: string; email_confirmed_at?: string | null; created_at: string }>;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { admin, callerId } = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action as Action;

    if (action === "list") {
      const users = await listAllUsers(admin);
      const ids = users.map((user) => user.id);
      const [{ data: profiles, error: profileError }, { data: roles, error: roleError }] = await Promise.all([
        ids.length > 0
          ? admin.from("profiles").select("id,full_name,phone,order_updates_email_consent,marketing_email_consent").in("id", ids)
          : Promise.resolve({ data: [], error: null }),
        ids.length > 0
          ? admin.from("user_roles").select("user_id,role").in("user_id", ids)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (profileError) throw profileError;
      if (roleError) throw roleError;

      const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      const adminIds = new Set((roles ?? []).filter((role) => role.role === "admin").map((role) => role.user_id));
      const developerIds = new Set((roles ?? []).filter((role) => role.role === "developer").map((role) => role.user_id));
      return json({ users: users.map((user) => ({
        id: user.id,
        email: user.email ?? "",
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        full_name: profilesById.get(user.id)?.full_name ?? "",
        phone: profilesById.get(user.id)?.phone ?? "",
        order_updates_email_consent: profilesById.get(user.id)?.order_updates_email_consent ?? false,
        marketing_email_consent: profilesById.get(user.id)?.marketing_email_consent ?? false,
        is_admin: adminIds.has(user.id),
        is_developer: developerIds.has(user.id),
      })) });
    }

    if (action === "set_admin" || action === "set_developer") {
      const userId = typeof body.user_id === "string" ? body.user_id : "";
      const enabled = typeof body.enabled === "boolean" ? body.enabled : typeof body.is_admin === "boolean" ? body.is_admin : null;
      const role = action === "set_admin" ? "admin" : "developer";
      if (!userId || enabled === null) return json({ error: "Invalid request" }, 400);
      if (role === "admin" && userId === callerId && !enabled) return json({ error: "Você não pode remover seu próprio acesso administrativo." }, 400);

      const { data: target } = await admin.auth.admin.getUserById(userId);
      if (!target.user) return json({ error: "User not found" }, 404);
      const { data: existing, error: existingError } = await admin.from("user_roles").select("id").eq("user_id", userId).eq("role", role).maybeSingle();
      if (existingError) throw existingError;

      if (enabled && !existing) {
        const { error } = await admin.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
      if (!enabled && existing) {
        if (role === "admin") {
        const { count, error: countError } = await admin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
        if (countError) throw countError;
        if ((count ?? 0) <= 1) return json({ error: "A plataforma precisa manter ao menos um administrador." }, 400);
        }
        const { error } = await admin.from("user_roles").delete().eq("id", existing.id);
        if (error) throw error;
      }
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error: unknown) {
    if (error instanceof Response) return json({ error: error.statusText || "Unauthorized" }, error.status);
    console.error("Admin users failed", error);
    return json({ error: "Não foi possível concluir a operação." }, 500);
  }
});
