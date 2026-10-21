"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getRpc } from "@/lib/db/server-rpc";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cancelReservation, reserveSession, type ReserveResult } from "@/lib/reservations/service";
import { isPushConfigured, sendPush, targetsForProfiles } from "@/lib/push/send";
import { notifyPromotionsAfterResponse } from "@/lib/push/dispatch";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import {
  cancelReservationSchema,
  fieldErrors,
  formDataToObject,
  profileSchema,
  pushSubscriptionSchema,
  reservationSchema,
  ticketAttendeeSchema,
  type PushSubscriptionInput,
} from "@/lib/validation/schemas";

function revalidatePortal() {
  revalidatePath("/mi-cuenta", "layout");
  revalidatePath("/experiencias");
  revalidatePath("/conferencias");
}

/** Reserva una sesión. El servidor valida propiedad del boleto, cupo y reglas en SQL. */
export async function reserveAction(input: { kind: "activity" | "conference"; sessionId: string; ticketId: string | null }): Promise<ActionResult<ReserveResult>> {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };
  try {
    const user = await requireUser();
    await enforceRateLimit("reserve", 20, 60_000, user.id);
    const result = await reserveSession(getRpc(), { profileId: user.id, ...parsed.data });
    revalidatePortal();
    return {
      ok: true,
      data: result,
      message:
        result.status === "confirmed"
          ? "¡Reserva confirmada!"
          : `Sesión llena: quedaste en lista de espera (lugar ${result.waitlist_position ?? "-"}).`,
    };
  } catch (error) {
    logError("reserveAction", error);
    return { ok: false, error: userMessage(error), code: error instanceof AppError ? error.code : undefined };
  }
}

export async function cancelReservationAction(input: { reservationId: string }): Promise<ActionResult<null>> {
  const parsed = cancelReservationSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Solicitud inválida." };
  try {
    const user = await requireUser();
    await enforceRateLimit("reserve", 20, 60_000, user.id);
    const r = await cancelReservation(getRpc(), { reservationId: parsed.data.reservationId, actorId: user.id });
    notifyPromotionsAfterResponse(r.promoted);
    revalidatePortal();
    return { ok: true, data: null, message: "Reserva cancelada. Liberamos tu lugar." };
  } catch (error) {
    logError("cancelReservationAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export type ProfileState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await requireUser();
    // Cliente con sesión: RLS + privilegios de columna limitan la edición a nombre y teléfono propios.
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName, phone: parsed.data.phone ?? null })
      .eq("id", user.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    revalidatePortal();
    return { success: "Datos actualizados." };
  } catch (error) {
    logError("updateProfileAction", error);
    return { error: userMessage(error) };
  }
}

/** Cambia el nombre impreso en un boleto propio (no altera la propiedad). */
export async function updateAttendeeNameAction(input: { ticketId: string; attendeeName: string }): Promise<ActionResult<null>> {
  const parsed = ticketAttendeeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Nombre inválido.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const user = await requireUser();
    const supabase = await createSupabaseServerClient();
    const { data: owned } = await supabase.from("tickets").select("id, status").eq("id", parsed.data.ticketId).maybeSingle();
    if (!owned) throw new AppError("TICKET_NOT_OWNED");
    if (owned.status !== "valid") throw new AppError("TICKET_NOT_VALID");
    const { error } = await createAdminClient()
      .from("tickets")
      .update({ attendee_name: parsed.data.attendeeName })
      .eq("id", parsed.data.ticketId)
      .eq("owner_profile_id", user.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    revalidatePortal();
    return { ok: true, data: null, message: "Nombre actualizado." };
  } catch (error) {
    logError("updateAttendeeNameAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

// --- Notificaciones push -----------------------------------------------------------

/** Guarda la suscripción push de este navegador para la cuenta con sesión. */
export async function savePushSubscriptionAction(input: PushSubscriptionInput): Promise<ActionResult<null>> {
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "No pudimos activar las notificaciones en este navegador." };
  try {
    const user = await requireUser();
    await enforceRateLimit("push-subscribe", 10, 60_000, user.id);
    // Un mismo navegador puede cambiar de cuenta: la suscripción pasa a la cuenta actual.
    const { error } = await createAdminClient()
      .from("push_subscriptions")
      .upsert(
        {
          profile_id: user.id,
          endpoint: parsed.data.endpoint,
          p256dh: parsed.data.keys.p256dh,
          auth: parsed.data.keys.auth,
          user_agent: parsed.data.userAgent?.slice(0, 300) ?? null,
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new AppError("UNKNOWN", error.message);
    return { ok: true, data: null, message: "¡Listo! Te avisaremos antes de tus clases." };
  } catch (error) {
    logError("savePushSubscriptionAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export async function removePushSubscriptionAction(endpoint: string): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint.slice(0, 1000)).eq("profile_id", user.id);
    return { ok: true, data: null, message: "Notificaciones desactivadas en este dispositivo." };
  } catch (error) {
    logError("removePushSubscriptionAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

/** Notificación de prueba a todos los dispositivos de la cuenta. */
export async function sendTestNotificationAction(): Promise<ActionResult<null>> {
  try {
    const user = await requireUser();
    await enforceRateLimit("push-test", 3, 10 * 60_000, user.id);
    if (!isPushConfigured()) throw new AppError("NOT_CONFIGURED");
    const targets = await targetsForProfiles([user.id]);
    if (!targets.length) return { ok: false, error: "Este dispositivo aún no tiene las notificaciones activadas." };
    const res = await sendPush(targets, {
      title: "¡Notificaciones activadas!",
      body: "Así te avisaremos antes de tus clases y durante el festival.",
      url: "/mi-cuenta",
      tag: "prueba",
    });
    return res.sent
      ? { ok: true, data: null, message: "Enviamos una notificación de prueba." }
      : { ok: false, error: "No se pudo entregar la notificación. Vuelve a activarlas." };
  } catch (error) {
    logError("sendTestNotificationAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
