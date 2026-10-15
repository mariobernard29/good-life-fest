import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CompleteRegistrationForm } from "@/components/forms/auth-forms";
import { getSessionUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activa tu cuenta" };

/**
 * Destino del correo de activación del registro manual: el enlace ya inició la
 * sesión (verifyOtp en /auth/callback); aquí la persona crea su contraseña.
 */
export default async function CompleteRegistrationPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <>
        <p className="eyebrow">Activa tu cuenta</p>
        <h1 className="display mt-2 text-5xl">El enlace venció</h1>
        <p className="mt-3 text-muted-foreground">
          Por seguridad, los enlaces solo funcionan una vez y por tiempo limitado. Pide uno nuevo con tu correo y te llegará al instante.
        </p>
        <Link href="/recuperar-contrasena" className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">
          Enviarme un enlace nuevo
        </Link>
      </>
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("full_name, email, activated_at").eq("id", user.id).maybeSingle();
  if (profile?.activated_at) redirect("/mi-cuenta");
  const first = profile?.full_name?.trim().split(/\s+/)[0];

  return (
    <>
      <p className="eyebrow">Último paso</p>
      <h1 className="display mt-2 text-5xl">{first ? `¡Hola, ${first}!` : "¡Bienvenida, bienvenido!"}</h1>
      <p className="mt-3 text-muted-foreground">
        Crea tu contraseña para entrar a tu portal: ahí verás tu código QR, apartarás tu lugar en las clases y activarás los avisos del festival.
      </p>
      <p className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm">
        Tu cuenta: <span className="font-medium">{profile?.email ?? user.email}</span>
      </p>
      <div className="mt-8">
        <CompleteRegistrationForm />
      </div>
    </>
  );
}
