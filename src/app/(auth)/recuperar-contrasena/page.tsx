import type { Metadata } from "next";
import Link from "next/link";
import { RecoverForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <>
      <p className="eyebrow">Recuperar acceso</p>
      <h1 className="display mt-2 text-5xl">¿Olvidaste tu contraseña?</h1>
      <p className="mt-3 text-muted-foreground">Te enviaremos un enlace para crear una nueva.</p>
      <div className="mt-8">
        <RecoverForm />
      </div>
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-olive hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </>
  );
}
