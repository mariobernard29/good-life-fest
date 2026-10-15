import type { Metadata } from "next";
import { AdminHeader, Panel, Pill, StatTile } from "@/components/admin/ui";
import { ActionForm, CheckboxField, Field, SelectField, TextareaField } from "@/components/forms/fields";
import { CancelNotificationButton } from "@/components/admin/row-actions";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotificationAction, saveReminderSettingsAction } from "@/app/admin/_actions/notifications";
import { reminderMinutes } from "@/lib/push/dispatch";
import { isPushConfigured } from "@/lib/push/send";
import { getCronSecret } from "@/lib/env";
import { formatDateTime, formatTime, utcToZonedLocal } from "@/lib/format";

export const metadata: Metadata = { title: "Notificaciones" };

const STATUS: Record<string, { label: string; tone: "green" | "amber" | "gray" | "red" | "olive" }> = {
  scheduled: { label: "Programado", tone: "amber" },
  sending: { label: "Enviando", tone: "olive" },
  sent: { label: "Enviado", tone: "green" },
  cancelled: { label: "Cancelado", tone: "gray" },
  failed: { label: "Falló", tone: "red" },
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  audience: "all" | "activity" | "conference";
  send_at: string;
  status: string;
  sent_count: number;
  failed_count: number;
  activities: { name: string } | null;
  conferences: { title: string } | null;
};

export default async function NotificationsAdminPage() {
  const ctx = await requireStaffPage("notifications.send", "/admin/notificaciones");
  const e = ctx.event;
  const tz = e.timezone;
  const admin = createAdminClient();
  const [{ data: notifications }, { data: acts }, { data: confs }, { count: devices }, { data: subscribers }] = await Promise.all([
    admin
      .from("notifications")
      .select("id, title, body, url, audience, send_at, status, sent_count, failed_count, activities(name), conferences(title)")
      .eq("event_id", e.id)
      .order("send_at", { ascending: false })
      .limit(100),
    admin.from("activities").select("id, name, starts_at").eq("event_id", e.id).neq("status", "draft").order("starts_at"),
    admin.from("conferences").select("id, title, starts_at").eq("event_id", e.id).eq("requires_reservation", true).neq("status", "draft").order("starts_at"),
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }),
    admin.from("push_subscriptions").select("profile_id").limit(5000),
  ]);
  const people = new Set((subscribers ?? []).map((s) => s.profile_id)).size;
  const lead = reminderMinutes(e.settings);
  const pushReady = isPushConfigured();
  const cronReady = Boolean(getCronSecret());

  const targets = [
    { value: "all", label: "Todos los participantes" },
    ...(acts ?? []).map((a) => ({ value: `activity:${a.id}`, label: `Clase · ${formatTime(a.starts_at, tz)} · ${a.name}` })),
    ...(confs ?? []).map((c) => ({ value: `conference:${c.id}`, label: `Conferencia · ${formatTime(c.starts_at, tz)} · ${c.title}` })),
  ];

  return (
    <>
      <AdminHeader title="Notificaciones" description={`Avisos push al celular de los participantes. Horas en ${tz}.`} />

      {(!pushReady || !cronReady) && (
        <Panel className="mb-6 border-warning/40 bg-warning/5">
          <p className="text-sm font-medium text-warning">Falta configuración</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground/80">
            {!pushReady && <li>Llaves VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT): sin ellas no se puede enviar nada.</li>}
            {!cronReady && <li>CRON_SECRET y el cron de Supabase (supabase/manual/2026-10-15-cron-notificaciones.sql): sin ellos no salen los recordatorios ni los avisos programados; los envíos «Ahora» sí funcionan.</li>}
          </ul>
        </Panel>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label="Personas con avisos activos" value={people} hint={`${devices ?? 0} dispositivos`} />
        <StatTile label="Recordatorio de clases" value={lead ? `${lead} min antes` : "Desactivado"} hint="Automático para cada reserva confirmada" />
        <StatTile label="Avisos programados" value={(notifications ?? []).filter((n) => n.status === "scheduled").length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="Nuevo aviso">
          <ActionForm action={createNotificationAction} submitLabel="Enviar / programar aviso">
            <Field label="Título" name="title" maxLength={80} required placeholder="¡Bienvenida al festival!" />
            <TextareaField label="Mensaje" name="body" maxLength={300} rows={3} required placeholder="Las puertas abren a las 8:00. Recoge tu welcome kit en la entrada." />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Destinatarios" name="target" options={targets} defaultValue="all" />
              <Field label="Abrir al tocar (opcional)" name="url" placeholder="/mi-cuenta/reservas" hint="Ruta del sitio; por defecto, Mi cuenta." />
              <SelectField
                label="Cuándo"
                name="when"
                defaultValue="scheduled"
                options={[
                  { value: "scheduled", label: "Programar" },
                  { value: "now", label: "Enviar ahora" },
                ]}
              />
              <Field label="Fecha y hora (si se programa)" name="sendAt" type="datetime-local" defaultValue={utcToZonedLocal(e.starts_at, tz)} />
            </div>
            <CheckboxField label="Publicar también en «Avisos del festival» del portal" name="alsoAnnounce" />
          </ActionForm>
        </Panel>

        <div className="space-y-6">
          <Panel title="Recordatorio automático">
            <ActionForm action={saveReminderSettingsAction} submitLabel="Guardar">
              <Field
                label="Minutos antes de cada clase reservada"
                name="reminderMinutes"
                type="number"
                min={0}
                max={1440}
                defaultValue={lead}
                hint="0 desactiva el recordatorio. Solo llega a quien activó las notificaciones."
              />
            </ActionForm>
          </Panel>

          <Panel title="Avisos">
            {(notifications ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay avisos.</p>
            ) : (
              <ul className="divide-y divide-border">
                {((notifications ?? []) as unknown as NotificationRow[]).map((n) => {
                  const st = STATUS[n.status] ?? STATUS.failed;
                  const to = n.audience === "all" ? "Todos" : (n.activities?.name ?? n.conferences?.title ?? "Sesión");
                  return (
                    <li key={n.id} className="py-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{n.title}</p>
                          <p className="text-foreground/75">{n.body}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {to} · {formatDateTime(n.send_at, tz)}
                            {n.status === "sent" && ` · ${n.sent_count} entregadas${n.failed_count ? `, ${n.failed_count} fallidas` : ""}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Pill tone={st.tone}>{st.label}</Pill>
                          {n.status === "scheduled" && <CancelNotificationButton id={n.id} />}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
