"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Límite de error global: nunca muestra detalles técnicos al usuario. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[ui]", error.digest ?? error.message);
  }, [error]);
  return (
    <main className="container-page flex min-h-[60svh] flex-col items-center justify-center text-center">
      <h1 className="display text-4xl">Algo salió mal</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Ocurrió un error inesperado. Intenta de nuevo; si el problema continúa, contacta al equipo del festival.
        {error.digest && <span className="mt-2 block font-mono text-xs">Referencia: {error.digest}</span>}
      </p>
      <Button onClick={reset} className="mt-8 rounded-full">
        Reintentar
      </Button>
    </main>
  );
}
