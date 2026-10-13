import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/auth-forms";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  return (
    <>
      <p className="eyebrow">Mi cuenta</p>
      <h1 className="display mt-2 text-5xl">Bienvenida, bienvenido</h1>
      <p className="mt-3 text-muted-foreground">Consulta tus entradas, tu código QR y reserva tus clases.</p>
      <div className="mt-8">
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          notice={error === "enlace" ? "El enlace no es válido o expiró. Inicia sesión o solicita uno nuevo." : undefined}
        />
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href={typeof next === "string" ? `/registro?next=${encodeURIComponent(next)}` : "/registro"} className="font-medium text-olive hover:underline">
          Crear cuenta
        </Link>
      </p>
    </>
  );
}
