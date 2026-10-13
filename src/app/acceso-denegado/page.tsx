import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <main className="container-page flex min-h-svh flex-col items-center justify-center text-center">
      <div className="grid size-14 place-items-center rounded-full bg-secondary text-olive">
        <ShieldAlert />
      </div>
      <h1 className="display mt-6 text-4xl">No tienes acceso a esta sección</h1>
      <p className="mt-3 max-w-md text-muted-foreground">Si crees que es un error, pide a un administrador del festival que revise tus permisos.</p>
      <Button asChild className="mt-8 rounded-full">
        <Link href="/mi-cuenta">Ir a mi cuenta</Link>
      </Button>
    </main>
  );
}
