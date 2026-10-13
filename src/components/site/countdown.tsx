"use client";

import { useSyncExternalStore } from "react";

// Reloj por minuto como "store" externo: sin setState dentro de efectos y sin desajuste de hidratación.
const subscribe = (cb: () => void) => {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
};
const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Cuenta regresiva al inicio del festival (se calcula en el navegador). */
export function Countdown({ to }: { to: string }) {
  const now = useSyncExternalStore(subscribe, minuteNow, () => null);
  if (now === null) return null;
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return null;
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return (
    <div className="fade-up mt-6 flex gap-3" aria-label={`Faltan ${days} días`}>
      {[
        [days, "días"],
        [hours, "horas"],
        [minutes, "min"],
      ].map(([n, label]) => (
        <div key={label} className="min-w-20 rounded-2xl border border-cream/25 bg-cream/10 px-4 py-2 text-center backdrop-blur-sm">
          <p className="display text-3xl tabular-nums">{n}</p>
          <p className="text-[0.65rem] tracking-[0.2em] text-cream/70 uppercase">{label}</p>
        </div>
      ))}
    </div>
  );
}
