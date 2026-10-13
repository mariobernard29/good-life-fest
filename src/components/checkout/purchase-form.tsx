"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createPurchaseAction } from "@/app/(public)/comprar/actions";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PurchaseOption = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  benefits: string[];
  maxPerOrder: number;
  available: number;
};

export function PurchaseForm({ options, preselect }: { options: PurchaseOption[]; preselect?: string }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(options.map((o) => [o.id, o.id === preselect && o.available > 0 ? 1 : 0])),
  );
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const total = options.reduce((s, o) => s + o.priceCents * (qty[o.id] ?? 0), 0);
  const count = Object.values(qty).reduce((a, b) => a + b, 0);

  const change = (o: PurchaseOption, delta: number) =>
    setQty((q) => ({ ...q, [o.id]: Math.max(0, Math.min((q[o.id] ?? 0) + delta, o.maxPerOrder)) }));

  function submit() {
    setError(null);
    start(async () => {
      const res = await createPurchaseAction({
        items: options.map((o) => ({ ticketTypeId: o.id, quantity: qty[o.id] ?? 0 })),
        acceptTerms: accept as true,
      });
      if (res.ok) router.push(`/comprar/pago/${res.data.orderId}`);
      else {
        setError(res.error);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        {options.map((o) => {
          const n = qty[o.id] ?? 0;
          const soldOut = o.available === 0;
          return (
            <div key={o.id} className={cn("rounded-3xl border bg-card p-6 transition-colors", n > 0 ? "border-olive ring-1 ring-olive/30" : "border-border", soldOut && "opacity-60")}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="display text-3xl">{o.name}</h3>
                  {o.description && <p className="mt-1 text-sm text-muted-foreground">{o.description}</p>}
                  <ul className="mt-3 space-y-1">
                    {o.benefits.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-foreground/80">
                        <Check className="size-3.5 text-olive" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <p className="text-2xl font-semibold tabular-nums">{formatMoney(o.priceCents)}</p>
                  {soldOut ? (
                    <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">Agotado</span>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1">
                      <Button type="button" size="icon" variant="ghost" className="rounded-full" onClick={() => change(o, -1)} disabled={n === 0} aria-label={`Quitar una entrada ${o.name}`}>
                        <Minus />
                      </Button>
                      <span className="w-8 text-center font-medium tabular-nums" aria-live="polite">
                        {n}
                      </span>
                      <Button type="button" size="icon" variant="ghost" className="rounded-full" onClick={() => change(o, 1)} disabled={n >= o.maxPerOrder} aria-label={`Agregar una entrada ${o.name}`}>
                        <Plus />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {!soldOut && o.available <= 20 && <p className="mt-3 text-xs font-medium text-sunset">Últimas {o.available} disponibles</p>}
            </div>
          );
        })}
      </div>

      <aside className="h-fit space-y-5 rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-24">
        <h2 className="display text-3xl">Resumen</h2>
        <ul className="space-y-2 text-sm">
          {options
            .filter((o) => (qty[o.id] ?? 0) > 0)
            .map((o) => (
              <li key={o.id} className="flex justify-between gap-3">
                <span>
                  {qty[o.id]} × {o.name}
                </span>
                <span className="tabular-nums">{formatMoney(o.priceCents * qty[o.id])}</span>
              </li>
            ))}
          {count === 0 && <li className="text-muted-foreground">Aún no eliges entradas.</li>}
        </ul>
        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-2xl font-semibold tabular-nums">{formatMoney(total)}</span>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={accept} onCheckedChange={(v) => setAccept(v === true)} className="mt-0.5" />
          <span>Acepto los términos de compra y el aviso de privacidad del festival.</span>
        </label>
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button onClick={submit} size="lg" className="h-12 w-full rounded-full text-base" disabled={pending || count === 0 || !accept}>
          {pending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
          {pending ? "Apartando tus entradas…" : "Continuar al pago"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Tus entradas quedan apartadas 15 minutos mientras completas el pago.</p>
      </aside>
    </div>
  );
}
