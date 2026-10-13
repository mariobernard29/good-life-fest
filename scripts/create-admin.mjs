#!/usr/bin/env node
/**
 * Asigna el rol super_admin (o event_admin) a una persona.
 *
 *   npm run admin:create -- correo@dominio.com
 *   npm run admin:create -- correo@dominio.com --role event_admin
 *
 * - Si la cuenta ya existe (se registró en /registro), solo asigna el rol.
 * - Si no existe, envía una invitación de Supabase Auth para que defina su contraseña.
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local.
 */
import { createClient } from "@supabase/supabase-js";

const [, , email, ...rest] = process.argv;
const roleFlag = rest.indexOf("--role");
const role = roleFlag >= 0 ? rest[roleFlag + 1] : "super_admin";

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Uso: npm run admin:create -- correo@dominio.com [--role super_admin|event_admin]");
  process.exit(1);
}
if (!["super_admin", "event_admin"].includes(role)) {
  console.error("Rol no válido. Usa super_admin o event_admin.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const normalized = email.trim().toLowerCase();
let { data: profile } = await admin.from("profiles").select("id, email").eq("email", normalized).maybeSingle();

if (!profile) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(normalized, {
    redirectTo: `${siteUrl}/auth/callback?next=/actualizar-contrasena`,
  });
  if (error) {
    console.error("No se pudo invitar al usuario:", error.message);
    process.exit(1);
  }
  console.log(`Invitación enviada a ${normalized}. Debe abrir el correo y definir su contraseña.`);
  profile = { id: data.user.id, email: normalized };
}

let eventId = null;
if (role === "event_admin") {
  const slug = process.env.EVENT_SLUG;
  const q = admin.from("events").select("id, name");
  const { data: ev } = slug ? await q.eq("slug", slug).maybeSingle() : await q.order("starts_at").limit(1).maybeSingle();
  if (!ev) {
    console.error("No se encontró el evento (revisa EVENT_SLUG).");
    process.exit(1);
  }
  eventId = ev.id;
}

const { data: existing } = await admin
  .from("event_staff")
  .select("id")
  .eq("user_id", profile.id)
  .filter("event_id", eventId ? "eq" : "is", eventId)
  .maybeSingle();

const res = existing
  ? await admin.from("event_staff").update({ role, is_active: true }).eq("id", existing.id)
  : await admin.from("event_staff").insert({ user_id: profile.id, event_id: eventId, role, is_active: true });

if (res.error) {
  console.error("Error al asignar el rol:", res.error.message);
  process.exit(1);
}

await admin.from("audit_logs").insert({
  actor_id: null,
  event_id: eventId,
  action: "staff.bootstrap",
  entity: "profile",
  entity_id: profile.id,
  details: { role, via: "scripts/create-admin.mjs" },
});

console.log(`Listo: ${normalized} ahora es ${role}.`);
