"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRpc } from "@/lib/db/server-rpc";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { AppError, logError, userMessage } from "@/lib/errors";
import {
  fieldErrors,
  formDataToObject,
  loginSchema,
  recoverSchema,
  registerSchema,
  updatePasswordSchema,
} from "@/lib/validation/schemas";
import { getCurrentEvent } from "@/lib/events/current";
import { FEST } from "@/content/festival";
import { getStaffAssignments } from "@/lib/auth/staff";
import { resolvePermissions, staffHome } from "@/lib/auth/permissions";

export type FormState = { error?: string; success?: string; fieldErrors?: Record<string, string[]>; values?: Record<string, string> };

/** Solo rutas internas: evita redirecciones abiertas. */
export async function safeNext(next: unknown): Promise<string | null> {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null;
}

async function claimGuestTickets(userId: string) {
  try {
    await getRpc().call("claim_guest_tickets", { p_user_id: userId });
  } catch (error) {
    logError("claimGuestTickets", error);
  }
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formDataToObject(formData);
  const parsed = loginSchema.safeParse(raw);
  const values = { email: String(raw.email ?? "") };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!isSupabaseConfigured()) return { error: userMessage(new AppError("NOT_CONFIGURED")), values };

  let destination = "/mi-cuenta";
  try {
    await enforceRateLimit("login", 10, 60_000);
    await enforceRateLimit("login-email", 8, 15 * 60_000, parsed.data.email);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error || !data.user) {
      if (error?.code === "email_not_confirmed") {
        return { error: "Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.", values };
      }
      return { error: "Correo o contraseña incorrectos.", values };
    }
    await claimGuestTickets(data.user.id);

    const next = await safeNext(parsed.data.next);
    if (next) {
      destination = next;
    } else {
      const event = await getCurrentEvent();
      if (event) {
        const assignments = await getStaffAssignments(data.user.id, event.id);
        if (assignments.length) destination = staffHome(resolvePermissions(assignments));
      }
    }
  } catch (error) {
    logError("loginAction", error);
    return { error: userMessage(error), values };
  }
  redirect(destination);
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = formDataToObject(formData);
  const parsed = registerSchema.safeParse(raw);
  const values = { fullName: String(raw.fullName ?? ""), email: String(raw.email ?? ""), phone: String(raw.phone ?? "") };
  const next = (await safeNext(raw.next)) ?? "/mi-cuenta/entradas";
  if (!FEST.ticketsOpen) return { error: "El registro de cuentas se abrirá con la venta de boletos.", values };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!isSupabaseConfigured()) return { error: userMessage(new AppError("NOT_CONFIGURED")), values };

  let hasSession = false;
  try {
    await enforceRateLimit("register", 5, 60_000);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
        data: { full_name: parsed.data.fullName, phone: parsed.data.phone ?? "" },
      },
    });
    if (error) {
      if (error.code === "weak_password") return { error: "La contraseña es demasiado débil.", values };
      if (error.code === "user_already_exists") return { error: "Ya existe una cuenta con ese correo. Inicia sesión.", values };
      logError("registerAction.signUp", error);
      return { error: "No pudimos crear tu cuenta. Intenta de nuevo.", values };
    }
    // Si la confirmación de correo está desactivada, ya hay sesión.
    if (data.session && data.user) {
      await claimGuestTickets(data.user.id);
      hasSession = true;
    }
  } catch (error) {
    logError("registerAction", error);
    return { error: userMessage(error), values };
  }
  if (hasSession) redirect(next);
  return {
    success: `Te enviamos un correo a ${parsed.data.email}. Abre el enlace del correo para activar tu cuenta; te regresaremos a donde te quedaste.`,
  };
}

export async function recoverAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = recoverSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  try {
    await enforceRateLimit("recover", 5, 15 * 60_000);
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${getSiteUrl()}/auth/callback?next=/actualizar-contrasena`,
    });
  } catch (error) {
    logError("recoverAction", error);
    if (error instanceof AppError && error.code === "RATE_LIMITED") return { error: userMessage(error) };
  }
  // Respuesta idéntica exista o no la cuenta (evita enumeración de usuarios).
  return { success: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña." };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = updatePasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: "El enlace expiró. Solicita uno nuevo." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.code === "same_password" ? "Usa una contraseña distinta a la anterior." : "No pudimos actualizar la contraseña." };
  }
  redirect("/mi-cuenta?contrasena=actualizada");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
