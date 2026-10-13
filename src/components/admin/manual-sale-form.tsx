"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Gift, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { manualSaleSchema } from "@/lib/validation/schemas";
import { manualSaleAction } from "@/app/admin/_actions/sales";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type In = z.input<typeof manualSaleSchema>;
type Out = z.output<typeof manualSaleSchema>;
type TypeOption = { id: string; name: string; priceCents: number; available: number };

const sel = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

export function ManualSaleForm({ ticketTypes, canComplimentary }: { ticketTypes: TypeOption[]; canComplimentary: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ reference: string; message: string } | null>(null);
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(manualSaleSchema),
    defaultValues: {
      ticketTypeId: ticketTypes[0]?.id ?? "",
      quantity: 1,
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      attendees: [{ name: "", email: "" }],
      mode: "paid",
      paymentMethod: "cash",
      notes: "",
    },
  });
  const { fields, replace } = useFieldArray({ control: form.control, name: "attendees" });
  const [quantity, mode, typeId] = useWatch({ control: form.control, name: ["quantity", "mode", "ticketTypeId"] });
  const qty = Math.max(1, Math.min(Number(quantity) || 1, 50));
  const type = ticketTypes.find((t) => t.id === typeId);
  const errors = form.formState.errors;

  useEffect(() => {
    const current = form.getValues("attendees");
    if (current.length !== qty) {
      replace(Array.from({ length: qty }, (_, i) => current[i] ?? { name: "", email: "" }));
    }
  }, [qty, form, replace]);

  const onSubmit = form.handleSubmit((values) => {
    start(async () => {
      const res = await manualSaleAction(values as In);
      if (res.ok) {
        toast.success(res.message);
        setResult({ reference: res.data.reference, message: res.message ?? "" });
        form.reset({ ...form.getValues(), buyerName: "", buyerEmail: "", buyerPhone: "", attendees: [{ name: "", email: "" }], quantity: 1, notes: "" });
      } else {
        toast.error(res.error);
      }
    });
  });

  if (ticketTypes.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay tipos de entrada disponibles para taquilla (estado «En venta» o «Solo taquilla»).</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {result && (
        <div className="flex flex-col gap-2 rounded-xl bg-success/10 p-4 text-sm text-success sm:flex-row sm:items-center sm:justify-between">
          <span>{result.message}</span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/asistentes?q=${result.reference}`}>Ver boletos y QR</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de registro">
        {(
          [
            { v: "paid", label: "Venta pagada", hint: "Pago recibido en taquilla", icon: Receipt },
            { v: "pending", label: "Pago por confirmar", hint: "Transferencia u otro: sin acceso hasta confirmar", icon: Receipt },
            ...(canComplimentary ? [{ v: "complimentary", label: "Cortesía", hint: "Gratuita · requiere motivo · auditada", icon: Gift }] : []),
          ] as const
        ).map((o) => (
          <label key={o.v} className={cn("cursor-pointer rounded-xl border p-3 text-sm", mode === o.v ? "border-olive bg-accent/60" : "border-border")}>
            <input type="radio" value={o.v} {...form.register("mode")} className="sr-only" />
            <span className="flex items-center gap-2 font-medium">
              <o.icon className="size-4 text-olive" /> {o.label}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{o.hint}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ticketTypeId">Tipo de entrada</Label>
          <select id="ticketTypeId" className={sel} {...form.register("ticketTypeId")}>
            {ticketTypes.map((t) => (
              <option key={t.id} value={t.id} disabled={t.available === 0}>
                {t.name} · {formatMoney(t.priceCents)} · {t.available} disp.
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input id="quantity" type="number" min={1} max={Math.min(50, type?.available ?? 50)} className="h-10" {...form.register("quantity")} />
        </div>
        <div className="space-y-1.5">
          <Label>Total</Label>
          <p className="flex h-10 items-center text-lg font-semibold tabular-nums">{mode === "complimentary" ? "$0 (cortesía)" : formatMoney((type?.priceCents ?? 0) * qty)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="buyerName">Nombre del comprador</Label>
          <Input id="buyerName" className="h-10" {...form.register("buyerName")} aria-invalid={Boolean(errors.buyerName)} />
          {errors.buyerName && <p className="text-xs text-destructive">{errors.buyerName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buyerEmail">Correo</Label>
          <Input id="buyerEmail" type="email" className="h-10" {...form.register("buyerEmail")} aria-invalid={Boolean(errors.buyerEmail)} />
          {errors.buyerEmail && <p className="text-xs text-destructive">{errors.buyerEmail.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buyerPhone">Teléfono</Label>
          <Input id="buyerPhone" type="tel" className="h-10" {...form.register("buyerPhone")} />
        </div>
      </div>

      {mode !== "complimentary" && (
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="paymentMethod">Forma de pago</Label>
          <select id="paymentMethod" className={sel} {...form.register("paymentMethod")}>
            <option value="cash">Efectivo</option>
            <option value="card_terminal">Terminal bancaria</option>
            <option value="transfer">Transferencia</option>
          </select>
          {errors.paymentMethod && <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>}
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Asistentes (opcional)</legend>
        <p className="text-xs text-muted-foreground">Si indicas un correo distinto al del comprador, ese boleto se vinculará a la cuenta de esa persona.</p>
        {fields.map((f, i) => (
          <div key={f.id} className="grid gap-2 sm:grid-cols-2">
            <Input placeholder={`Nombre asistente ${i + 1}`} className="h-10" {...form.register(`attendees.${i}.name`)} />
            <Input placeholder="Correo (opcional)" type="email" className="h-10" {...form.register(`attendees.${i}.email`)} />
            {errors.attendees?.[i]?.email && <p className="text-xs text-destructive sm:col-span-2">{errors.attendees[i]?.email?.message}</p>}
          </div>
        ))}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="notes">{mode === "complimentary" ? "Motivo de la cortesía (obligatorio)" : "Notas internas"}</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
        {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
      </div>

      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending && <Loader2 className="animate-spin" />}
        {mode === "complimentary" ? "Emitir cortesía" : "Registrar venta"}
      </Button>
    </form>
  );
}
