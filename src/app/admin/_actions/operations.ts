"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/admin/common";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import {
  announcementSchema,
  eventSettingsSchema,
  faqSchema,
  fieldErrors,
  formDataToObject,
  incidentCreateSchema,
  incidentUpdateSchema,
  staffInviteSchema,
} from "@/lib/validation/schemas";
import { assignableRoles, type StaffRole } from "@/lib/auth/permissions";
import { zonedLocalToUtc } from "@/lib/format";
import type { AdminFormState } from "./form-state";

// --- Incidencias ----------------------------------------------------------------
export async function createIncidentAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = incidentCreateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  let id: string;
  try {
    const ctx = await requireStaff("incidents.manage");
    const admin = createAdminClient();
    let ticketId: string | null = null;
    if (parsed.data.ticketCode) {
      const { data } = await admin.from("tickets").select("id").eq("event_id", ctx.event.id).eq("public_code", parsed.data.ticketCode.toUpperCase()).maybeSingle();
      if (!data) return { fieldErrors: { ticketCode: ["No existe un boleto con ese código en este evento."] } };
      ticketId = data.id;
    }
    const { data, error } = await admin
      .from("incidents")
      .insert({
        event_id: ctx.event.id,
        ticket_id: ticketId,
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description,
        priority: parsed.data.priority,
        created_by: ctx.user.id,
        assigned_to: ctx.user.id,
      })
      .select("id")
      .single();
    if (error) throw new AppError("UNKNOWN", error.message);
    id = data.id;
    await admin.from("incident_updates").insert({ incident_id: id, author_id: ctx.user.id, note: "Incidencia creada", to_status: "open" });
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "incident.created", entity: "incident", entityId: id, details: { category: parsed.data.category, priority: parsed.data.priority } });
  } catch (error) {
    logError("createIncidentAction", error);
    return { error: userMessage(error) };
  }
  revalidatePath("/admin/incidencias");
  redirect(`/admin/incidencias/${id}`);
}

export async function updateIncidentAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = incidentUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  try {
    const ctx = await requireStaff("incidents.manage");
    const d = parsed.data;
    const admin = createAdminClient();
    const { data: current } = await admin.from("incidents").select("status, priority, assigned_to, resolution").eq("id", d.incidentId).eq("event_id", ctx.event.id).maybeSingle();
    if (!current) throw new AppError("NOT_FOUND");
    if ((d.status === "resolved" || d.status === "closed") && !d.resolution && !current.resolution) {
      return { fieldErrors: { resolution: ["Describe la resolución antes de cerrar la incidencia."] } };
    }
    const changes: Record<string, unknown> = {};
    if (current.priority !== d.priority) changes.priority = { from: current.priority, to: d.priority };
    if ((current.assigned_to ?? "") !== (d.assignedTo ?? "")) changes.assigned_to = { to: d.assignedTo || null };
    if (d.resolution && d.resolution !== current.resolution) changes.resolution = true;

    const { error } = await admin
      .from("incidents")
      .update({
        status: d.status,
        priority: d.priority,
        assigned_to: d.assignedTo || null,
        resolution: d.resolution || current.resolution,
        closed_at: d.status === "resolved" || d.status === "closed" ? new Date().toISOString() : null,
      })
      .eq("id", d.incidentId);
    if (error) throw new AppError("UNKNOWN", error.message);
    await admin.from("incident_updates").insert({
      incident_id: d.incidentId,
      author_id: ctx.user.id,
      note: d.note,
      from_status: current.status,
      to_status: d.status,
      changes,
    });
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "incident.updated", entity: "incident", entityId: d.incidentId, details: { status: d.status, ...changes } });
    revalidatePath(`/admin/incidencias/${d.incidentId}`);
    revalidatePath("/admin/incidencias");
    return { success: "Incidencia actualizada." };
  } catch (error) {
    logError("updateIncidentAction", error);
    return { error: userMessage(error) };
  }
}

// --- Personal y permisos ---------------------------------------------------------
export async function addStaffAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = staffInviteSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  try {
    const ctx = await requireStaff("staff.manage");
    const d = parsed.data;
    if (!assignableRoles(ctx.roles).includes(d.role as StaffRole)) throw new AppError("FORBIDDEN");
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("id").ilike("email", d.email.replace(/[\\%_]/g, "\\$&")).maybeSingle();
    if (!profile) {
      return { fieldErrors: { email: ["Esa persona aún no tiene cuenta. Pídele que se registre en /registro y vuelve a intentarlo."] } };
    }
    const row = {
      user_id: profile.id,
      event_id: d.role === "super_admin" ? null : ctx.event.id,
      role: d.role,
      permissions: d.issueComplimentary ? ["issue_complimentary"] : [],
      is_active: true,
      created_by: ctx.user.id,
    };
    const { data: existing } = await admin
      .from("event_staff")
      .select("id")
      .eq("user_id", profile.id)
      .filter("event_id", row.event_id ? "eq" : "is", row.event_id ?? null)
      .maybeSingle();
    const res = existing
      ? await admin.from("event_staff").update({ role: row.role, permissions: row.permissions, is_active: true }).eq("id", existing.id)
      : await admin.from("event_staff").insert(row);
    if (res.error) throw new AppError("UNKNOWN", res.error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "staff.assigned", entity: "profile", entityId: profile.id, details: { role: d.role, permissions: row.permissions } });
    revalidatePath("/admin/usuarios");
    return { success: "Permisos asignados." };
  } catch (error) {
    logError("addStaffAction", error);
    return { error: userMessage(error) };
  }
}

export async function setStaffActiveAction(staffId: string, active: boolean): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("staff.manage");
    const admin = createAdminClient();
    const { data: row } = await admin.from("event_staff").select("user_id, role, event_id").eq("id", staffId).maybeSingle();
    if (!row || (row.event_id && row.event_id !== ctx.event.id)) throw new AppError("NOT_FOUND");
    if (row.user_id === ctx.user.id) return { ok: false, error: "No puedes desactivar tus propios permisos." };
    if (!assignableRoles(ctx.roles).includes(row.role as StaffRole)) throw new AppError("FORBIDDEN");
    const { error } = await admin.from("event_staff").update({ is_active: active }).eq("id", staffId);
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: active ? "staff.activated" : "staff.deactivated", entity: "profile", entityId: row.user_id, details: { role: row.role } });
    revalidatePath("/admin/usuarios");
    return { ok: true, data: null, message: active ? "Acceso reactivado." : "Acceso desactivado." };
  } catch (error) {
    logError("setStaffActiveAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

// --- Configuración del evento ---------------------------------------------------
export async function saveEventSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = eventSettingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  try {
    const ctx = await requireStaff("settings.manage");
    const d = parsed.data;
    const admin = createAdminClient();
    const { data: consumed } = await admin.rpc("event_consumed", { p_event_id: ctx.event.id });
    if (typeof consumed === "number" && d.maxCapacity < consumed) {
      return { fieldErrors: { maxCapacity: [`Ya hay ${consumed} entradas emitidas o apartadas; la capacidad no puede ser menor.`] } };
    }
    const settings = {
      ...ctx.event.settings,
      online_sales_enabled: d.onlineSalesEnabled,
      reservations_open: d.reservationsOpen,
      max_reservations_per_ticket: d.maxReservationsPerTicket || null,
      contact_email: d.contactEmail,
      contact_whatsapp: d.contactWhatsapp,
      instagram_url: d.instagramUrl,
      hero_tagline: d.heroTagline,
    };
    const { error } = await admin
      .from("events")
      .update({
        name: d.name,
        description: d.description,
        location_name: d.locationName,
        address: d.address,
        starts_at: zonedLocalToUtc(d.startsAt, ctx.event.timezone),
        ends_at: zonedLocalToUtc(d.endsAt, ctx.event.timezone),
        max_capacity: d.maxCapacity,
        status: d.status,
        settings,
      })
      .eq("id", ctx.event.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "event.settings_updated", entity: "event", entityId: ctx.event.id, details: { max_capacity: d.maxCapacity, status: d.status, online_sales_enabled: d.onlineSalesEnabled, reservations_open: d.reservationsOpen } });
    revalidatePath("/", "layout");
    return { success: "Configuración guardada." };
  } catch (error) {
    logError("saveEventSettingsAction", error);
    return { error: userMessage(error) };
  }
}

export async function setDemoFlagAction(isDemo: boolean): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("settings.manage");
    const { error } = await createAdminClient().from("events").update({ settings: { ...ctx.event.settings, is_demo: isDemo } }).eq("id", ctx.event.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "event.demo_flag", entity: "event", entityId: ctx.event.id, details: { is_demo: isDemo } });
    revalidatePath("/", "layout");
    return { ok: true, data: null, message: isDemo ? "Aviso de demostración activado." : "Aviso de demostración retirado." };
  } catch (error) {
    return { ok: false, error: userMessage(error) };
  }
}

export async function addAnnouncementAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = announcementSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    const ctx = await requireStaff("settings.manage");
    const { error } = await createAdminClient().from("announcements").insert({ ...parsed.data, event_id: ctx.event.id, created_by: ctx.user.id });
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "announcement.created", entity: "announcement" });
    revalidatePath("/admin/configuracion");
    revalidatePath("/mi-cuenta");
    return { success: "Aviso publicado." };
  } catch (error) {
    return { error: userMessage(error) };
  }
}

export async function addFaqAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = faqSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    const ctx = await requireStaff("settings.manage");
    const { error } = await createAdminClient()
      .from("faqs")
      .insert({ question: parsed.data.question, answer: parsed.data.answer, sort_order: parsed.data.sortOrder, event_id: ctx.event.id });
    if (error) throw new AppError("UNKNOWN", error.message);
    revalidatePath("/admin/configuracion");
    revalidatePath("/faq");
    return { success: "Pregunta agregada." };
  } catch (error) {
    return { error: userMessage(error) };
  }
}

export async function deleteSettingItemAction(kind: "announcement" | "faq", id: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("settings.manage");
    const table = kind === "announcement" ? "announcements" : "faqs";
    const { error } = await createAdminClient().from(table).delete().eq("id", id).eq("event_id", ctx.event.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: `${kind}.deleted`, entity: kind, entityId: id });
    revalidatePath("/admin/configuracion");
    revalidatePath("/faq");
    revalidatePath("/mi-cuenta");
    return { ok: true, data: null, message: "Eliminado." };
  } catch (error) {
    return { ok: false, error: userMessage(error) };
  }
}
