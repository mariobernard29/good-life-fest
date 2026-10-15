import "server-only";
import type { RpcClient } from "@/lib/db/rpc";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAuthLink } from "@/lib/auth/links";
import { sendEmail } from "@/lib/email/send";
import { activationEmail } from "@/lib/email/templates";
import { createManualSale, type ManualSaleMode, type SaleSource } from "@/lib/orders/manual-sale";
import { getAppEnv } from "@/lib/env";
import { AppError, logError } from "@/lib/errors";

/** Página donde la persona crea su contraseña al abrir el enlace del correo. */
export const ACTIVATION_PATH = "/completar-registro";

export type RegisterParticipantInput = {
  eventId: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  ticketTypeId: string;
  saleSource: SaleSource;
  mode: ManualSaleMode;
  paymentMethod?: "cash" | "card_terminal" | "transfer";
  wristbandDelivered: boolean;
  notes?: string;
};

export type RegisterParticipantResult = {
  profileId: string;
  reference: string;
  status: "paid" | "awaiting_payment";
  /** Se creó una cuenta nueva (antes no existía ese correo). */
  newAccount: boolean;
  /** La cuenta aún no está activada y se le mandó (o intentó mandar) el enlace. */
  activationPending: boolean;
  emailSent: boolean;
  /** Solo fuera de producción y sin correo configurado: enlace para probar localmente. */
  devLink?: string;
};

const ACTIVE_TICKET = ["valid", "checked_in", "pending_payment"];

function devLinkFor(sent: boolean, url: string) {
  return !sent && getAppEnv() !== "production" ? url : undefined;
}

/**
 * Registro manual de una persona que compró en un punto físico o por mensaje:
 *  1. crea su cuenta con un enlace de invitación (el trigger crea el perfil con
 *     nombre, teléfono y edad) — o reutiliza la cuenta si el correo ya existe;
 *  2. le emite su boleto (venta manual) ya vinculado a esa cuenta;
 *  3. le envía el correo para confirmar y crear su contraseña.
 * Si la venta falla, la cuenta recién creada se elimina para no dejar basura.
 */
export async function registerParticipant(rpc: RpcClient, input: RegisterParticipantInput): Promise<RegisterParticipantResult> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();

  const { data: existing, error: lookupError } = await admin
    .from("profiles")
    .select("id, full_name, phone, age, activated_at")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) throw new AppError("UNKNOWN", lookupError.message);

  // Una persona = una entrada.
  let dup = admin
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("event_id", input.eventId)
    .in("status", ACTIVE_TICKET);
  dup = existing ? dup.or(`owner_profile_id.eq.${existing.id},attendee_email.eq."${email}"`) : dup.eq("attendee_email", email);
  const { count } = await dup;
  if (count) throw new AppError("PARTICIPANT_ALREADY_REGISTERED");

  let profileId: string;
  let newAccount = false;
  let activationUrl: string | null = null;

  if (!existing) {
    const link = await createAuthLink({
      type: "invite",
      email,
      next: ACTIVATION_PATH,
      data: { full_name: input.fullName, phone: input.phone, age: String(input.age) },
    });
    profileId = link.user.id;
    newAccount = true;
    activationUrl = link.url;
  } else {
    profileId = existing.id;
    // Completar datos que falten sin sobrescribir lo que la persona ya capturó.
    const patch: Record<string, unknown> = {};
    if (!existing.full_name) patch.full_name = input.fullName;
    if (!existing.phone) patch.phone = input.phone;
    if (existing.age == null) patch.age = input.age;
    if (Object.keys(patch).length) await admin.from("profiles").update(patch).eq("id", existing.id);
    if (!existing.activated_at) {
      activationUrl = (await createAuthLink({ type: "recovery", email, next: ACTIVATION_PATH })).url;
    }
  }

  let sale;
  try {
    sale = await createManualSale(rpc, {
      eventId: input.eventId,
      staffId: input.staffId,
      ticketTypeId: input.ticketTypeId,
      quantity: 1,
      buyerEmail: email,
      buyerName: input.fullName,
      buyerPhone: input.phone,
      attendees: [{ name: input.fullName, email }],
      mode: input.mode,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      saleSource: input.saleSource,
      wristbandDelivered: input.wristbandDelivered,
    });
  } catch (error) {
    if (newAccount) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(profileId);
      if (deleteError) logError("registerParticipant.rollback", deleteError);
    }
    throw error;
  }

  let emailSent = false;
  if (activationUrl) {
    try {
      emailSent = (await sendEmail(email, activationEmail({ name: input.fullName, url: activationUrl }))).sent;
    } catch (error) {
      // El registro ya quedó; el personal puede reenviar el correo desde Asistentes.
      logError("registerParticipant.email", error);
    }
  }

  return {
    profileId,
    reference: sale.reference,
    status: sale.status,
    newAccount,
    activationPending: Boolean(activationUrl),
    emailSent,
    devLink: activationUrl ? devLinkFor(emailSent, activationUrl) : undefined,
  };
}

/** Reenvía el correo de activación a una cuenta que todavía no crea su contraseña. */
export async function resendActivation(profileId: string): Promise<{ alreadyActive: boolean; emailSent: boolean; devLink?: string }> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name, activated_at")
    .eq("id", profileId)
    .maybeSingle();
  if (!profile) throw new AppError("NOT_FOUND");
  if (profile.activated_at) return { alreadyActive: true, emailSent: false };

  const { url } = await createAuthLink({ type: "recovery", email: profile.email, next: ACTIVATION_PATH });
  const { sent } = await sendEmail(profile.email, activationEmail({ name: profile.full_name, url }));
  return { alreadyActive: false, emailSent: sent, devLink: devLinkFor(sent, url) };
}

/** Marca la cuenta como activada (la persona ya creó su contraseña). */
export async function markAccountActivated(profileId: string) {
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ activated_at: new Date().toISOString() })
    .eq("id", profileId)
    .is("activated_at", null);
  if (error) logError("markAccountActivated", error);
}
