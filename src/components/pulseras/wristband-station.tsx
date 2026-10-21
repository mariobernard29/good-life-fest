"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Search, Watch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchWristbandsAction, type WristbandSearchResult } from "@/app/pulseras/actions";
import { setWristbandAction } from "@/app/admin/_actions/participants";
import { formatTime } from "@/lib/format";

const INACTIVE = new Set(["cancelled", "refunded"]);

/** Entrega de pulseras el día del evento (sobre todo para quien compró por mensaje). */
export function WristbandStation() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WristbandSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, start] = useTransition();

  return (
    <main className="mx-auto max-w-lg px-4 pb-10">
      <div className="rounded-3xl border border-dashed border-cream/20 p-6 text-center">
        <Watch className="mx-auto size-8 text-cream/70" />
        <p className="display mt-2 text-3xl">Entrega de pulseras</p>
        <p className="mt-1 text-sm text-cream/70">Busca a la persona por nombre, correo o folio de su boleto virtual y entrégale su pulsera.</p>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            try {
              const res = await searchWristbandsAction(query);
              if (res.ok) setResults(res.data);
              else setError(res.error);
            } catch {
              setError("Error de conexión.");
            }
          });
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, correo o GL-XXXXX-XXXXX"
          className="h-12 border-cream/20 bg-cream/10 text-cream placeholder:text-cream/40"
          autoComplete="off"
          aria-label="Buscar boleto"
        />
        <Button type="submit" className="h-12 rounded-xl bg-cream text-ink hover:bg-cream/90" disabled={searching} aria-label="Buscar">
          {searching ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-[#f0a594]">{error}</p>}
      {results && results.length === 0 && <p className="mt-3 text-sm text-cream/60">Sin coincidencias.</p>}
      <ul className="mt-3 space-y-2">
        {results?.map((r) => (
          <ResultRow key={r.id} r={r} />
        ))}
      </ul>
    </main>
  );
}

function ResultRow({ r }: { r: WristbandSearchResult }) {
  const [deliveredAt, setDeliveredAt] = useState(r.wristbandDeliveredAt);
  const [saving, start] = useTransition();
  const inactive = INACTIVE.has(r.status);

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-cream/10 p-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{r.name || "Sin nombre"}</p>
        <p className="truncate text-xs text-cream/60">
          {r.type} · <span className="font-mono">{r.code}</span>
        </p>
        {r.email && <p className="truncate text-xs text-cream/60">{r.email}</p>}
        {r.status === "pending_payment" && <p className="text-xs text-[#f2c46d]">Pago pendiente de confirmar</p>}
      </div>
      {inactive ? (
        <span className="shrink-0 rounded-full bg-[#a83a26] px-3 py-1 text-xs text-white">Boleto cancelado</span>
      ) : deliveredAt ? (
        <span className="flex shrink-0 items-center gap-1.5 text-xs text-cream/70">
          <CheckCircle2 className="size-4 text-[#7fc896]" /> Entregada · {formatTime(deliveredAt)}
        </span>
      ) : (
        <Button
          size="sm"
          className="shrink-0 rounded-full bg-[#f2c46d] text-ink hover:bg-[#f2c46d]/90"
          disabled={saving}
          onClick={() =>
            start(async () => {
              try {
                const res = await setWristbandAction(r.id, true);
                if (res.ok) {
                  setDeliveredAt(res.data.deliveredAt ?? new Date().toISOString());
                  toast.success(res.message ?? "Pulsera entregada");
                } else toast.error(res.error);
              } catch {
                toast.error("Error de conexión. Intenta de nuevo.");
              }
            })
          }
        >
          {saving ? <Loader2 className="animate-spin" /> : <Watch />} Entregar
        </Button>
      )}
    </li>
  );
}
