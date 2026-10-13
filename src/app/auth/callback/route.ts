import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRpc } from "@/lib/db/server-rpc";
import { logError } from "@/lib/errors";

/**
 * Destino de los enlaces de correo de Supabase (confirmación y recuperación).
 * Soporta el flujo PKCE (?code=) y el de token_hash (?token_hash=&type=).
 * Tras verificar el correo, vincula las compras hechas como invitado.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const nextParam = url.searchParams.get("next") ?? "/mi-cuenta";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/mi-cuenta";
  const supabase = await createSupabaseServerClient();

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  if (!ok) return NextResponse.redirect(new URL("/login?error=enlace", url.origin));

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await getRpc()
      .call("claim_guest_tickets", { p_user_id: data.user.id })
      .catch((e) => logError("auth.callback.claim", e));
  }
  return NextResponse.redirect(new URL(type === "recovery" ? "/actualizar-contrasena" : next, url.origin));
}
