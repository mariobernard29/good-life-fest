import type { Metadata } from "next";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { ActionForm, CheckboxField, Field, SelectField, TextareaField } from "@/components/forms/fields";
import { DeleteSettingItemButton, DemoFlagToggle } from "@/components/admin/row-actions";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { addAnnouncementAction, addFaqAction, saveEventSettingsAction } from "@/app/admin/_actions/operations";
import { formatDateTime, utcToZonedLocal } from "@/lib/format";

export const metadata: Metadata = { title: "Configuración del evento" };

export default async function SettingsPage() {
  const ctx = await requireStaffPage("settings.manage", "/admin/configuracion");
  const e = ctx.event;
  const s = e.settings ?? {};
  const admin = createAdminClient();
  const [{ data: announcements }, { data: faqs }] = await Promise.all([
    admin.from("announcements").select("id, title, created_at").eq("event_id", e.id).order("created_at", { ascending: false }),
    admin.from("faqs").select("id, question, sort_order").eq("event_id", e.id).order("sort_order"),
  ]);

  return (
    <>
      <AdminHeader
        title="Configuración del evento"
        description={`Zona horaria: ${e.timezone}. Las fechas se capturan en hora local del evento.`}
        actions={<DemoFlagToggle isDemo={Boolean(s.is_demo)} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Datos generales y reglas">
          <ActionForm action={saveEventSettingsAction} submitLabel="Guardar configuración">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del evento" name="name" defaultValue={e.name} required className="sm:col-span-2" />
              <Field label="Lugar" name="locationName" defaultValue={e.location_name} />
              <Field label="Dirección" name="address" defaultValue={e.address} />
              <Field label="Inicio" name="startsAt" type="datetime-local" defaultValue={utcToZonedLocal(e.starts_at, e.timezone)} required />
              <Field label="Fin" name="endsAt" type="datetime-local" defaultValue={utcToZonedLocal(e.ends_at, e.timezone)} required />
              <Field label="Capacidad general del festival" name="maxCapacity" type="number" min={1} defaultValue={e.max_capacity} required />
              <SelectField
                label="Estado"
                name="status"
                defaultValue={e.status}
                options={[
                  { value: "draft", label: "Borrador (sitio sin contenido)" },
                  { value: "published", label: "Publicado" },
                  { value: "closed", label: "Cerrado (sin venta en línea)" },
                  { value: "archived", label: "Archivado" },
                ]}
              />
              <Field label="Máx. reservas activas por boleto (0 = sin límite)" name="maxReservationsPerTicket" type="number" min={0} defaultValue={s.max_reservations_per_ticket ?? 0} />
              <Field label="Frase de portada" name="heroTagline" defaultValue={s.hero_tagline ?? ""} />
              <Field label="Correo de contacto" name="contactEmail" type="email" defaultValue={s.contact_email ?? ""} />
              <Field label="WhatsApp" name="contactWhatsapp" defaultValue={s.contact_whatsapp ?? ""} />
              <Field label="Instagram (URL)" name="instagramUrl" defaultValue={s.instagram_url ?? ""} className="sm:col-span-2" />
            </div>
            <TextareaField label="Descripción" name="description" defaultValue={e.description} rows={3} />
            <div className="grid gap-2 sm:grid-cols-2">
              <CheckboxField label="Venta en línea habilitada" name="onlineSalesEnabled" defaultChecked={s.online_sales_enabled !== false} />
              <CheckboxField label="Reservas de clases abiertas" name="reservationsOpen" defaultChecked={s.reservations_open !== false} />
            </div>
          </ActionForm>
        </Panel>
        <div className="space-y-6">
          <Panel title="Avisos para asistentes">
            <ActionForm action={addAnnouncementAction} submitLabel="Publicar aviso">
              <Field label="Título" name="title" required />
              <TextareaField label="Mensaje" name="body" rows={2} />
            </ActionForm>
            <ul className="mt-4 divide-y divide-border text-sm">
              {(announcements ?? []).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    {a.title} <span className="text-xs text-muted-foreground">· {formatDateTime(a.created_at)}</span>
                  </span>
                  <DeleteSettingItemButton kind="announcement" id={a.id} />
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Preguntas frecuentes">
            <ActionForm action={addFaqAction} submitLabel="Agregar pregunta">
              <Field label="Pregunta" name="question" required />
              <TextareaField label="Respuesta" name="answer" rows={2} required />
              <Field label="Orden" name="sortOrder" type="number" min={0} defaultValue={(faqs?.length ?? 0) + 1} />
            </ActionForm>
            <ul className="mt-4 divide-y divide-border text-sm">
              {(faqs ?? []).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 py-2">
                  <span>{f.question}</span>
                  <DeleteSettingItemButton kind="faq" id={f.id} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
