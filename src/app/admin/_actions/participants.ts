"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";
import { getRpc } from "@/lib/db/server-rpc";
import { audit } from "@/lib/admin/common";
import { registerParticipant, resendActivation, type RegisterParticipantResult } from "@/lib/participants/register";
import { setWristbandStatus } from "@/lib/tickets/wristband";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import { fieldErrors, participantSchema, type ParticipantInput } from "@/lib/validation/schemas";

export async function registerParticipantAction(input: ParticipantInput): Promise<ActionResult<RegisterParticipantResult>> {
  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del formulario.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const ctx = await requireStaff("participants.register");
    if (parsed.data.mode === "complimentary" && !hasPermission(ctx.permissions, "sales.complimentary")) {
      throw new AppError("FORBIDDEN_COMPLIMENTARY");
    }
    await enforceRateLimit("participant-register", 60, 60_000, ctx.user.id);
    const d = parsed.data;
    const result = await registerParticipant(getRpc(), {
      eventId: ctx.event.id,
      staffId: ctx.user.id,
      fullName: d.fullName,
      email: d.email,
      phone: d.phone,
      age: d.age,
      ticketTypeId: d.ticketTypeId,
      saleSource: d.saleSource,
      mode: d.mode,
      paymentMethod: d.paymentMethod,
      wristbandDelivered: d.wristbandDelivered,
      notes: d.notes,
    });
    await audit({
      actorId: ctx.user.id,
      eventId: ctx.event.id,
      action: "participant.registered",
      entity: "profile",
      entityId: result.profileId,
      details: { reference: result.reference, new_account: result.newAccount, email_sent: result.emailSent, sale_source: d.saleSource },
    });
    revalidatePath("/admin", "layout");

    const parts = [`Registro listo: ${d.fullName} · entrada ${result.reference}.`];
    if (result.status === "awaiting_payment") parts.push("El boleto se activará al confirmar el pago.");
    if (!result.activationPending) parts.push("Ya tenía su cuenta activa: la entrada aparece en su portal.");
    else if (result.emailSent) parts.push(`Le enviamos el correo para activar su cuenta a ${d.email}.`);
    else if (result.devLink) parts.push("El correo aún no está configurado (Resend); abajo está el enlace de activación.");
    else parts.push("No se pudo enviar el correo de activación; usa «Reenviar correo» en Asistentes.");
    return { ok: true, data: result, message: parts.join(" ") };
  } catch (error) {
    logError("registerParticipantAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export async function resendActivationAction(profileId: string): Promise<ActionResult<{ devLink?: string }>> {
  try {
    const ctx = await requireStaff("participants.register");
    await enforceRateLimit("participant-resend", 5, 10 * 60_000, profileId);
    const res = await resendActivation(profileId);
    if (res.alreadyActive) return { ok: false, error: "Esta persona ya activó su cuenta." };
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "participant.activation_resent", entity: "profile", entityId: profileId });
    return {
      ok: true,
      data: { devLink: res.devLink },
      message: res.emailSent ? "Correo de activación reenviado." : "El correo no está configurado; revisa la consola del servidor.",
    };
  } catch (error) {
    logError("resendActivationAction", error);
    return { ok: false, error: userMessage(error) };
  }
}

export async function setWristbandAction(ticketId: string, delivered: boolean): Promise<ActionResult<{ deliveredAt: string | null }>> {
  try {
    const ctx = await requireStaff("wristbands.manage");
    const res = await setWristbandStatus(getRpc(), { ticketId, staffId: ctx.user.id, delivered });
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      data: { deliveredAt: res.wristband_delivered_at },
      message: delivered ? "Pulsera marcada como entregada." : "Pulsera marcada como pendiente.",
    };
  } catch (error) {
    logError("setWristbandAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
