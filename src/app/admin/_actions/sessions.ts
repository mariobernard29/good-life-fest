"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpc } from "@/lib/db/server-rpc";
import { cancelReservation, cancelSession, updateSessionCapacity, type SessionKind } from "@/lib/reservations/service";
import { audit } from "@/lib/admin/common";
import { notifyPromotionsAfterResponse } from "@/lib/push/dispatch";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import { activitySchema, conferenceSchema, fieldErrors, formDataToObject } from "@/lib/validation/schemas";
import { zonedLocalToUtc } from "@/lib/format";
import type { AdminFormState } from "./form-state";

const TABLE: Record<SessionKind, "activities" | "conferences"> = { activity: "activities", conference: "conferences" };
const PATH: Record<SessionKind, string> = { activity: "/admin/actividades", conference: "/admin/conferencias" };

/** Sesiones en el mismo lugar con horario traslapado (advertencia, no bloqueo). */
async function scheduleConflicts(eventId: string, location: string, startsAt: string, endsAt: string, excludeId?: string) {
  if (!location) return [];
  const admin = createAdminClient();
  const [a, c] = await Promise.all([
    admin.from("activities").select("id, name").eq("event_id", eventId).eq("location", location).neq("status", "cancelled").lt("starts_at", endsAt).gt("ends_at", startsAt),
    admin.from("conferences").select("id, title").eq("event_id", eventId).eq("location", location).neq("status", "cancelled").lt("starts_at", endsAt).gt("ends_at", startsAt),
  ]);
  return [
    ...(a.data ?? []).filter((x) => x.id !== excludeId).map((x) => x.name as string),
    ...(c.data ?? []).filter((x) => x.id !== excludeId).map((x) => x.title as string),
  ];
}

async function saveSession(kind: SessionKind, formData: FormData): Promise<AdminFormState> {
  const raw = formDataToObject(formData);
  const parsed = (kind === "activity" ? activitySchema : conferenceSchema).safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  if (parsed.data.status === "cancelled") {
    return { error: "Para cancelar una sesión usa el botón «Cancelar sesión»: así también se cancelan sus reservas." };
  }

  let savedId: string | undefined;
  let warning: string | undefined;
  try {
    const ctx = await requireStaff("sessions.manage");
    const d = parsed.data as Record<string, unknown> & typeof parsed.data;
    const tz = ctx.event.timezone;
    const startsAt = zonedLocalToUtc(d.startsAt, tz);
    const endsAt = zonedLocalToUtc(d.endsAt, tz);

    const common = {
      description: d.description,
      starts_at: startsAt,
      ends_at: endsAt,
      location: d.location,
      status: d.status,
      requires_ticket: d.requiresTicket,
      waitlist_enabled: d.waitlistEnabled,
      cancellation_cutoff_minutes: d.cancellationCutoffMinutes,
    };
    const specific =
      kind === "activity"
        ? {
            name: d.name as string,
            category: d.category as string,
            instructor: d.instructor as string,
            instructor_bio: d.instructorBio as string,
            image_url: (d.imageUrl as string) || null,
          }
        : {
            title: d.title as string,
            speaker_name: d.speakerName as string,
            speaker_bio: d.speakerBio as string,
            speaker_photo_url: (d.speakerPhotoUrl as string) || null,
            requires_reservation: d.requiresReservation as boolean,
          };

    const admin = createAdminClient();
    if (!d.id) {
      const { data, error } = await admin
        .from(TABLE[kind])
        .insert({ event_id: ctx.event.id, capacity: d.capacity, ...common, ...specific })
        .select("id")
        .single();
      if (error) throw new AppError("UNKNOWN", error.message);
      savedId = data.id;
      await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "session.created", entity: kind, entityId: savedId });
    } else {
      const { data: current } = await admin.from(TABLE[kind]).select("capacity, starts_at, ends_at").eq("id", d.id).eq("event_id", ctx.event.id).maybeSingle();
      if (!current) throw new AppError("SESSION_NOT_FOUND");

      // Cambio de cupo: siempre por la función transaccional (valida reservas activas).
      if (current.capacity !== d.capacity) {
        const resolution = d.capacityResolution || null;
        try {
          const r = await updateSessionCapacity(getRpc(), {
            kind,
            sessionId: d.id,
            capacity: d.capacity,
            resolution: resolution as "keep_existing" | "move_excess_to_waitlist" | null,
            actorId: ctx.user.id,
          });
          notifyPromotionsAfterResponse(r.promoted, ctx.event);
          if (r.overbooked > 0) warning = `Atención: quedan ${r.overbooked} reservas por encima del nuevo cupo (se mantuvieron).`;
          if (r.moved_to_waitlist > 0) warning = `${r.moved_to_waitlist} reservas pasaron a lista de espera.`;
        } catch (error) {
          if (error instanceof AppError && error.code === "CAPACITY_BELOW_RESERVATIONS") {
            return { error: userMessage(error), needsCapacityResolution: { confirmed: Number(error.detail ?? 0) } };
          }
          throw error;
        }
      }

      const { error } = await admin.from(TABLE[kind]).update({ ...common, ...specific }).eq("id", d.id).eq("event_id", ctx.event.id);
      if (error) throw new AppError("UNKNOWN", error.message);
      savedId = d.id;
      await audit({
        actorId: ctx.user.id,
        eventId: ctx.event.id,
        action: "session.updated",
        entity: kind,
        entityId: savedId,
        details: { schedule_changed: current.starts_at !== startsAt || current.ends_at !== endsAt, status: d.status },
      });
    }

    const conflicts = await scheduleConflicts(ctx.event.id, d.location, startsAt, endsAt, savedId);
    if (conflicts.length) {
      warning = [warning, `Conflicto de horario en «${d.location}» con: ${conflicts.join(", ")}.`].filter(Boolean).join(" ");
    }
  } catch (error) {
    logError("saveSession", error);
    return { error: userMessage(error) };
  }

  revalidatePath(PATH[kind]);
  revalidatePath("/admin");
  const qs = new URLSearchParams({ guardado: "1", editar: savedId! });
  if (warning) qs.set("aviso", warning);
  redirect(`${PATH[kind]}?${qs.toString()}`);
}

export async function saveActivityAction(_prev: AdminFormState, formData: FormData) {
  return saveSession("activity", formData);
}

export async function saveConferenceAction(_prev: AdminFormState, formData: FormData) {
  return saveSession("conference", formData);
}

export async function cancelSessionAction(kind: SessionKind, sessionId: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("sessions.manage");
    const r = await cancelSession(getRpc(), { kind, sessionId, actorId: ctx.user.id });
    revalidatePath(PATH[kind]);
    return { ok: true, data: null, message: `Sesión cancelada. ${r.reservations_cancelled} reserva(s) cancelada(s).` };
  } catch (error) {
    logError("cancelSessionAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export async function adminCancelReservationAction(reservationId: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("reservations.manage");
    // Verifica que la reserva pertenezca al evento del personal.
    const { data } = await createAdminClient().from("reservations").select("event_id").eq("id", reservationId).maybeSingle();
    if (!data || data.event_id !== ctx.event.id) throw new AppError("RESERVATION_NOT_FOUND");
    const r = await cancelReservation(getRpc(), { reservationId, actorId: ctx.user.id, asAdmin: true });
    notifyPromotionsAfterResponse(r.promoted, ctx.event);
    revalidatePath("/admin/reservas");
    return { ok: true, data: null, message: r.promoted.length ? "Reserva cancelada; se asignó el lugar a la lista de espera." : "Reserva cancelada." };
  } catch (error) {
    logError("adminCancelReservationAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
