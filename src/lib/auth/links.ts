import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/env";
import { AppError } from "@/lib/errors";

export type AuthLinkType = "invite" | "recovery";

/**
 * Genera un enlace de un solo uso SIN que Supabase mande su propio correo; el
 * correo lo enviamos nosotros (src/lib/email). El enlace apunta a /auth/callback
 * con token_hash, que se verifica en el servidor con verifyOtp.
 *
 *  - invite:   crea la cuenta (el trigger crea el perfil con `data`) y confirma
 *              el correo al abrirse. Falla si el correo ya tiene cuenta.
 *  - recovery: para una cuenta existente (reenvío de activación o contraseña olvidada).
 */
export async function createAuthLink(input: {
  type: AuthLinkType;
  email: string;
  next: string;
  data?: Record<string, unknown>;
}): Promise<{ url: string; user: User }> {
  const admin = createAdminClient();
  const { data, error } =
    input.type === "invite"
      ? await admin.auth.admin.generateLink({ type: "invite", email: input.email, options: { data: input.data } })
      : await admin.auth.admin.generateLink({ type: "recovery", email: input.email });

  if (error || !data.properties?.hashed_token) {
    if (error?.code === "email_exists") throw new AppError("PARTICIPANT_ALREADY_REGISTERED", error.message);
    if (error?.code === "user_not_found") throw new AppError("NOT_FOUND", error.message);
    throw new AppError("UNKNOWN", error?.message ?? "generateLink sin token");
  }

  const params = new URLSearchParams({
    token_hash: data.properties.hashed_token,
    type: input.type,
    next: input.next,
  });
  return { url: `${getSiteUrl()}/auth/callback?${params.toString()}`, user: data.user };
}
