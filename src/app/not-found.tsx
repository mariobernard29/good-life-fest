import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-svh flex-col items-center justify-center text-center">
      <Logo className="w-36" />
      <h1 className="display mt-10 text-5xl">Esta página no existe</h1>
      <p className="mt-3 text-muted-foreground">Puede que el enlace haya cambiado o que el contenido ya no esté disponible.</p>
      <Button asChild className="mt-8 rounded-full">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
