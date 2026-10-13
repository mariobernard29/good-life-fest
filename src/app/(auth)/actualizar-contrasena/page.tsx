import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/forms/auth-forms";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function UpdatePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?error=enlace");
  return (
    <>
      <p className="eyebrow">Seguridad</p>
      <h1 className="display mt-2 text-5xl">Crea una nueva contraseña</h1>
      <div className="mt-8">
        <UpdatePasswordForm />
      </div>
    </>
  );
}
