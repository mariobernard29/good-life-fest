"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { AlertOctagon, CheckCircle2, Clock, Keyboard, Loader2, Search, TriangleAlert, Watch, WifiOff, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkInAction, searchTicketsAction, type CheckInSearchResult } from "@/app/check-in/actions";
import { setWristbandAction } from "@/app/admin/_actions/participants";
import { CHECK_IN_LABELS } from "@/lib/checkin/labels";
import type { CheckInResponse } from "@/lib/checkin/service";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const Scanner = dynamic(() => import("@yudiel/react-qr-scanner").then((m) => m.Scanner), {
  ssr: false,
  loading: () => <div className="grid aspect-square place-items-center text-sm text-cream/60">Iniciando cámara…</div>,
});

type Outcome = { kind: "result"; data: CheckInResponse } | { kind: "network" } | { kind: "error"; message: string };

const TONE_STYLES = {
  success: "bg-[#2f6b45] text-white",
  warning: "bg-[#b7791f] text-white",
  error: "bg-[#a83a26] text-white",
};

export function CheckInStation({ areas, canWristband }: { areas: string[]; canWristband: boolean }) {
  const [area, setArea] = useState(areas[0]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const lastScan = useRef<{ value: string; at: number }>({ value: "", at: 0 });

  const validate = useCallback(
    (raw: string, method: "scan" | "manual") => {
      start(async () => {
        try {
          const res = await checkInAction({ input: raw, accessArea: area, method });
          if (res.ok) {
            setOutcome({ kind: "result", data: res.data });
            navigator.vibrate?.(res.data.result === "accepted" ? 120 : [80, 60, 80]);
          } else setOutcome({ kind: "error", message: res.error });
        } catch {
          // Falla de red o del servidor: NUNCA se asume acceso autorizado.
          setOutcome({ kind: "network" });
          navigator.vibrate?.([200, 100, 200]);
        }
      });
    },
    [area],
  );

  const onScan = useCallback(
    (codes: { rawValue: string }[]) => {
      const value = codes[0]?.rawValue;
      if (!value || pending) return;
      const now = Date.now();
      if (value === lastScan.current.value && now - lastScan.current.at < 4000) return; // evita lecturas repetidas
      lastScan.current = { value, at: now };
      validate(value, "scan");
    },
    [pending, validate],
  );

  return (
    <main className="mx-auto max-w-lg px-4 pb-10">
      <div className="mb-4 flex items-center gap-2 overflow-x-auto" role="radiogroup" aria-label="Acceso a validar">
        {areas.map((a) => (
          <button
            key={a}
            role="radio"
            aria-checked={area === a}
            onClick={() => setArea(a)}
            className={cn("rounded-full border px-4 py-1.5 text-sm", area === a ? "border-cream bg-cream text-ink" : "border-cream/30 text-cream/80")}
          >
            {a}
          </button>
        ))}
      </div>

      <ResultCard outcome={outcome} pending={pending} onDismiss={() => setOutcome(null)} />
      {canWristband && !pending && outcome?.kind === "result" && <WristbandBar key={outcome.data.ticket?.id} response={outcome.data} />}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={mode === "scan" ? "secondary" : "ghost"} className="h-11 rounded-full text-cream data-[variant=secondary]:text-ink" onClick={() => setMode("scan")}>
          Escanear QR
        </Button>
        <Button variant={mode === "search" ? "secondary" : "ghost"} className="h-11 rounded-full text-cream data-[variant=secondary]:text-ink" onClick={() => setMode("search")}>
          <Keyboard /> Código / correo
        </Button>
      </div>

      {mode === "scan" ? (
        <div className="mt-4 overflow-hidden rounded-3xl border border-cream/15 bg-black">
          <Scanner
            onScan={onScan}
            onError={() => setOutcome({ kind: "error", message: "No se pudo acceder a la cámara. Revisa los permisos del navegador o usa la búsqueda manual." })}
            formats={["qr_code"]}
            paused={pending}
            components={{ finder: true, torch: true }}
            constraints={{ facingMode: "environment" }}
            sound={false}
          />
        </div>
      ) : (
        <ManualSearch onValidate={(code) => validate(code, "manual")} disabled={pending} />
      )}
      <p className="mt-6 text-center text-xs text-cream/50">Cada validación se registra con tu usuario. Ante cualquier error, no permitas el acceso y registra una incidencia.</p>
    </main>
  );
}

function ResultCard({ outcome, pending, onDismiss }: { outcome: Outcome | null; pending: boolean; onDismiss: () => void }) {
  if (pending) {
    return (
      <div className="flex min-h-40 items-center justify-center gap-3 rounded-3xl bg-cream/10 p-6" aria-live="polite">
        <Loader2 className="size-6 animate-spin" /> Validando…
      </div>
    );
  }
  if (!outcome) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-cream/20 p-6 text-center text-cream/70" aria-live="polite">
        <p className="display text-3xl text-cream">Listo para escanear</p>
        <p className="mt-1 text-sm">Apunta la cámara al código QR del asistente.</p>
      </div>
    );
  }
  if (outcome.kind === "network") {
    return (
      <button onClick={onDismiss} className="w-full rounded-3xl bg-[#5a5f55] p-6 text-left text-white" aria-live="assertive">
        <WifiOff className="size-10" />
        <p className="display mt-3 text-4xl">Error de conexión</p>
        <p className="mt-1 text-sm text-white/80">No se pudo validar. No permitas el acceso; reintenta cuando haya señal.</p>
      </button>
    );
  }
  if (outcome.kind === "error") {
    return (
      <button onClick={onDismiss} className="w-full rounded-3xl bg-[#a83a26] p-6 text-left text-white" aria-live="assertive">
        <AlertOctagon className="size-10" />
        <p className="display mt-3 text-3xl">No se pudo validar</p>
        <p className="mt-1 text-sm text-white/85">{outcome.message}</p>
      </button>
    );
  }
  const { result, ticket } = outcome.data;
  const meta = CHECK_IN_LABELS[result];
  const Icon = meta.tone === "success" ? CheckCircle2 : result === "payment_pending" ? Clock : meta.tone === "warning" ? TriangleAlert : XCircle;
  return (
    <button onClick={onDismiss} className={cn("w-full rounded-3xl p-6 text-left transition-colors", TONE_STYLES[meta.tone])} aria-live="assertive">
      <Icon className="size-12" />
      <p className="display mt-3 text-4xl leading-tight">{meta.title}</p>
      {ticket && (
        <div className="mt-3 space-y-0.5 text-sm text-white/90">
          <p className="text-lg font-semibold text-white">{ticket.attendee_name || "Sin nombre"}</p>
          <p>
            {ticket.ticket_type} · <span className="font-mono">{ticket.public_code}</span>
          </p>
          {result === "already_used" && ticket.checked_in_at && <p>Ingresó a las {formatTime(ticket.checked_in_at)}</p>}
        </div>
      )}
      <p className="mt-4 text-xs text-white/70">Toca para continuar</p>
    </button>
  );
}

function ManualSearch({ onValidate, disabled }: { onValidate: (code: string) => void; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckInSearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, start] = useTransition();

  return (
    <div className="mt-4 space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          if (/^GL-[A-F0-9]{5}-[A-F0-9]{5}$/i.test(query.trim())) {
            onValidate(query.trim());
            return;
          }
          start(async () => {
            try {
              const res = await searchTicketsAction(query);
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
          placeholder="GL-XXXXX-XXXXX, correo o nombre"
          className="h-12 border-cream/20 bg-cream/10 text-cream placeholder:text-cream/40"
          autoCapitalize="characters"
          autoComplete="off"
        />
        <Button type="submit" className="h-12 rounded-xl bg-cream text-ink hover:bg-cream/90" disabled={searching || disabled}>
          {searching ? <Loader2 className="animate-spin" /> : <Search />}
        </Button>
      </form>
      {error && <p className="text-sm text-[#f0a594]">{error}</p>}
      {results && results.length === 0 && <p className="text-sm text-cream/60">Sin coincidencias.</p>}
      <ul className="space-y-2">
        {results?.map((r) => (
          <li key={r.code} className="flex items-center justify-between gap-3 rounded-2xl bg-cream/10 p-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{r.name || "Sin nombre"}</p>
              <p className="truncate text-xs text-cream/60">
                {r.type} · <span className="font-mono">{r.code}</span> · {r.email}
              </p>
              <p className={cn("text-xs", r.wristband ? "text-cream/60" : "text-[#f2c46d]")}>{r.wristband ? "Pulsera entregada" : "Pulsera pendiente"}</p>
            </div>
            <Button size="sm" className="shrink-0 rounded-full bg-cream text-ink hover:bg-cream/90" disabled={disabled || r.status !== "valid"} onClick={() => onValidate(r.code)}>
              {r.status === "valid" ? "Validar" : r.status === "checked_in" ? "Ya ingresó" : "No válido"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Entrega de pulsera en la entrada (sobre todo para quien compró por mensaje). */
function WristbandBar({ response }: { response: CheckInResponse }) {
  const ticket = response.ticket;
  const [deliveredAt, setDeliveredAt] = useState(ticket?.wristband_delivered_at ?? null);
  const [saving, start] = useTransition();
  if (!ticket || ticket.wristband_delivered_at === undefined) return null;
  if (response.result === "cancelled" || response.result === "refunded") return null;

  if (deliveredAt) {
    return (
      <p className="mt-3 flex items-center gap-2 rounded-2xl bg-cream/10 px-4 py-3 text-sm text-cream/80">
        <Watch className="size-4" /> Pulsera entregada · {formatTime(deliveredAt)}
      </p>
    );
  }
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f2c46d] px-4 py-3 text-ink">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Watch className="size-5" /> Pulsera pendiente
      </p>
      <Button
        size="sm"
        className="shrink-0 rounded-full bg-ink text-cream hover:bg-ink/90"
        disabled={saving}
        onClick={() =>
          start(async () => {
            try {
              const res = await setWristbandAction(ticket.id, true);
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
        {saving ? <Loader2 className="animate-spin" /> : null} Entregar pulsera
      </Button>
    </div>
  );
}
