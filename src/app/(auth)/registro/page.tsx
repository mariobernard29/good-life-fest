import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/forms/auth-forms";
import { FEST } from "@/content/festival";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: PageProps<"/registro">) {
  if (!FEST.selfSignup) redirect("/login");
  const { email, next } = await searchParams;
  return (
    <>
      <p className="eyebrow">Crear cuenta</p>
      <h1 className="display mt-2 text-5xl">Tu lugar en el festival</h1>
      <p className="mt-3 text-muted-foreground">
        Si compraste sin cuenta, regístrate con el mismo correo: al verificarlo, tus entradas aparecerán automáticamente.
      </p>
      <div className="mt-8">
        <RegisterForm email={typeof email === "string" ? email : undefined} next={typeof next === "string" ? next : undefined} />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href={typeof next === "string" ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-medium text-olive hover:underline">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
