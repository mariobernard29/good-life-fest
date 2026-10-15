"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/admin/common";
import { deliverNotification } from "@/lib/push/dispatch";
import { isPushConfigured } from "@/lib/push/send";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import { fieldErrors, formDataToObject, notificationSchema, reminderSettingsSchema } from "@/lib/validation/schemas";
import { formatDateTime, zonedLocalToUtc } from "@/lib/format";
import type { AdminFormState } from "./form-state";

/** Crea un aviso push: se envía de inmediato o queda programado para el despachador. */
export async function createNotificationAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = notificationSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  try {
    const ctx = await requireStaff("notifications.send");
    if (!isPushConfigured()) throw new AppError("NOT_CONFIGURED", "VAPID");
    const d = parsed.data;
    const admin = createAdminClient();

    const [audience, sessionId] = d.target === "all" ? (["all", null] as const) : (d.target.split(":") as ["activity" | "conference", string]);
    if (sessionId) {
      const { data: session } = await admin
        .from(audience === "activity" ? "activities" : "conferences")
        .select("id")
        .eq("id", sessionId)
        .eq("event_id", ctx.event.id)
        .maybeSingle();
      if (!session) return { fieldErrors: { target: ["La sesión no existe."] } };
    }

    const sendAt = d.when === "now" ? new Date().toISOString() : zonedLocalToUtc(d.sendAt!, ctx.event.timezone);
    if (d.when === "scheduled" && new Date(sendAt).getTime() < Date.now() - 60_000) {
      return { fieldErrors: { sendAt: ["Esa hora ya pasó."] } };
    }

    const { data: created, error } = await admin
      .from("notifications")
      .insert({
        event_id: ctx.event.id,
        title: d.title,
        body: d.body,
        url: d.url || null,
        audience,
        activity_id: audience === "activity" ? sessionId : null,
        conference_id: audience === "conference" ? sessionId : null,
        send_at: sendAt,
        // Los envíos inmediatos se toman aquí mismo; los programados, el despachador.
        status: d.when === "now" ? "sending" : "scheduled",
        created_by: ctx.user.id,
      })
      .select("id, title, body, url")
      .single();
    if (error || !created) throw new AppError("UNKNOWN", error?.message);

    if (d.alsoAnnounce) {
      await admin.from("announcements").insert({ event_id: ctx.event.id, title: d.title, body: d.body, created_by: ctx.user.id });
      revalidatePath("/mi-cuenta");
    }
    await audit({
      actorId: ctx.user.id,
      eventId: ctx.event.id,
      action: d.when === "now" ? "notification.sent" : "notification.scheduled",
      entity: "notification",
      entityId: created.id,
      details: { audience, send_at: sendAt },
    });

    let success = `Aviso programado para ${formatDateTime(sendAt, ctx.event.timezone)}.`;
    if (d.when === "now") {
      const res = await deliverNotification(created);
      success = `Aviso enviado a ${res.sent} dispositivo${res.sent === 1 ? "" : "s"}${res.failed ? ` (${res.failed} sin entregar)` : ""}.`;
    }
    revalidatePath("/admin/notificaciones");
    return { success };
  } catch (error) {
    logError("createNotificationAction", error);
    if (error instanceof AppError && error.code === "NOT_CONFIGURED") {
      return { error: "Faltan las llaves VAPID para enviar notificaciones (ver .env.example)." };
    }
    return { error: userMessage(error) };
  }
}

export async function cancelNotificationAction(id: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("notifications.send");
    const { data } = await createAdminClient()
      .from("notifications")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("event_id", ctx.event.id)
      .eq("status", "scheduled")
      .select("id");
    if (!data?.length) return { ok: false, error: "El aviso ya se envió o no existe." };
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "notification.cancelled", entity: "notification", entityId: id });
    revalidatePath("/admin/notificaciones");
    return { ok: true, data: null, message: "Aviso cancelado." };
  } catch (error) {
    logError("cancelNotificationAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

/** Minutos de anticipación del recordatorio automático de cada clase reservada. */
export async function saveReminderSettingsAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = reminderSettingsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    const ctx = await requireStaff("notifications.send");
    const { error } = await createAdminClient()
      .from("events")
      .update({ settings: { ...ctx.event.settings, reminder_minutes: parsed.data.reminderMinutes } })
      .eq("id", ctx.event.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({
      actorId: ctx.user.id,
      eventId: ctx.event.id,
      action: "event.reminders_updated",
      entity: "event",
      entityId: ctx.event.id,
      details: { reminder_minutes: parsed.data.reminderMinutes },
    });
    revalidatePath("/admin/notificaciones");
    revalidatePath("/mi-cuenta");
    return {
      success: parsed.data.reminderMinutes ? `Recordatorio ${parsed.data.reminderMinutes} min antes de cada clase.` : "Recordatorios automáticos desactivados.",
    };
  } catch (error) {
    logError("saveReminderSettingsAction", error);
    return { error: userMessage(error) };
  }
}
