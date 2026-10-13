import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { AppError } from "@/lib/errors";

export type SessionUser = { id: string; email: string; emailConfirmed: boolean };

/**
 * Usuario autenticado de la solicitud actual. Usa getUser(), que valida el
 * token contra Supabase Auth (no confía solo en la cookie).
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    emailConfirmed: Boolean(data.user.email_confirmed_at),
  };
});

/** Para páginas: redirige a /login si no hay sesión. */
export async function requireUserPage(next: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Para Server Actions / Route Handlers: lanza error si no hay sesión. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}
