#!/usr/bin/env node
/**
 * Crea un usuario YA CONFIRMADO (sin correo de verificación) y opcionalmente le asigna un rol.
 * Útil para cuentas de prueba o del equipo en desarrollo.
 *
 *   npm run user:create -- correo@dominio.com "contraseña" [--role super_admin|event_admin|ticketing_staff|checkin_staff]
 *
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local.
 * La contraseña no se imprime ni se guarda en ningún archivo.
 */
import { createClient } from "@supabase/supabase-js";

const [, , email, password, ...rest] = process.argv;
const roleIdx = rest.indexOf("--role");
const role = roleIdx >= 0 ? rest[roleIdx + 1] : null;
const ROLES = ["super_admin", "event_admin", "ticketing_staff", "checkin_staff"];

if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !password) {
  console.error('Uso: npm run user:create -- correo@dominio.com "contraseña" [--role super_admin]');
  process.exit(1);
}
if (password.length < 6) {
  console.error("La contraseña debe tener al menos 6 caracteres (mínimo de Supabase). Se recomiendan 8 o más.");
  process.exit(1);
}
if (role && !ROLES.includes(role)) {
  console.error(`Rol no válido. Opciones: ${ROLES.join(", ")}`);
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

const { data, error } = await admin.auth.admin.createUser({
  email: normalized,
  password,
  email_confirm: true,
  user_metadata: { full_name: normalized.split("@")[0] },
});
if (error) {
  console.error("No se pudo crear el usuario:", error.message);
  process.exit(1);
}
console.log(`Usuario creado y confirmado: ${normalized}`);

if (role) {
  let eventId = null;
  if (role !== "super_admin") {
    const slug = process.env.EVENT_SLUG;
    const q = admin.from("events").select("id");
    const { data: ev } = slug ? await q.eq("slug", slug).maybeSingle() : await q.order("starts_at").limit(1).maybeSingle();
    if (!ev) {
      console.error("No se encontró el evento (revisa EVENT_SLUG). El usuario quedó creado sin rol.");
      process.exit(1);
    }
    eventId = ev.id;
  }
  const { error: roleError } = await admin.from("event_staff").insert({ user_id: data.user.id, event_id: eventId, role });
  if (roleError) {
    console.error("Usuario creado, pero no se pudo asignar el rol:", roleError.message);
    process.exit(1);
  }
  await admin.from("audit_logs").insert({ action: "staff.bootstrap", entity: "profile", entity_id: data.user.id, event_id: eventId, details: { role, via: "scripts/create-user.mjs" } });
  console.log(`Rol asignado: ${role}`);
}
