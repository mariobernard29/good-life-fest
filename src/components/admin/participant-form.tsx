"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Gift, Loader2, MapPin, MessageCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { participantSchema } from "@/lib/validation/schemas";
import { registerParticipantAction } from "@/app/admin/_actions/participants";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type In = z.input<typeof participantSchema>;
type Out = z.output<typeof participantSchema>;
type TypeOption = { id: string; name: string; priceCents: number; available: number };

const sel = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function ParticipantForm({ ticketTypes, canComplimentary }: { ticketTypes: TypeOption[]; canComplimentary: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ reference: string; message: string; devLink?: string } | null>(null);
  const form = useForm<In, unknown, Out>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      age: "" as unknown as number,
      ticketTypeId: ticketTypes.find((t) => t.available > 0)?.id ?? ticketTypes[0]?.id ?? "",
      saleSource: "punto_fisico",
      mode: "paid",
      paymentMethod: "cash",
      wristbandDelivered: true,
      notes: "",
    },
  });
  const [mode, typeId, saleSource, delivered] = useWatch({
    control: form.control,
    name: ["mode", "ticketTypeId", "saleSource", "wristbandDelivered"],
  });
  const type = ticketTypes.find((t) => t.id === typeId);
  const errors = form.formState.errors;

  // En punto físico la pulsera se entrega al momento; por mensaje queda pendiente.
  const pickSource = (value: "punto_fisico" | "mensaje") => {
    form.setValue("saleSource", value);
    form.setValue("wristbandDelivered", value === "punto_fisico");
  };

  const onSubmit = form.handleSubmit((values) => {
    start(async () => {
      const res = await registerParticipantAction(values as In);
      if (res.ok) {
        toast.success("Participante registrado");
        setResult({ reference: res.data.reference, message: res.message ?? "", devLink: res.data.devLink });
        form.reset({ ...form.getValues(), fullName: "", email: "", phone: "", age: "" as unknown as number, notes: "" });
      } else {
        toast.error(res.error);
        if (res.fieldErrors) {
          for (const [key, msgs] of Object.entries(res.fieldErrors)) {
            if (msgs?.[0]) form.setError(key as keyof In, { message: msgs[0] });
          }
        }
      }
    });
  });

  if (ticketTypes.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay tipos de entrada disponibles (estado «En venta» o «Solo taquilla»).</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {result && (
        <div className="space-y-2 rounded-xl bg-success/10 p-4 text-sm text-success">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{result.message}</span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/asistentes?q=${result.reference}`}>Ver en Asistentes</Link>
            </Button>
          </div>
          {result.devLink && (
            <p className="break-all text-xs text-muted-foreground">
              Solo desarrollo (correo sin configurar) · enlace de activación: <a href={result.devLink} className="underline">{result.devLink}</a>
            </p>
          )}
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Datos de la persona</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" autoComplete="off" className="h-10" {...form.register("fullName")} aria-invalid={Boolean(errors.fullName)} />
            <FieldError message={errors.fullName?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" autoComplete="off" className="h-10" {...form.register("email")} aria-invalid={Boolean(errors.email)} />
            <p className="text-xs text-muted-foreground">Aquí le llegará el enlace para crear su contraseña.</p>
            <FieldError message={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" type="tel" autoComplete="off" className="h-10" {...form.register("phone")} aria-invalid={Boolean(errors.phone)} />
            <FieldError message={errors.phone?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="age">Edad</Label>
            <Input id="age" type="number" inputMode="numeric" min={1} max={120} className="h-10 max-w-32" {...form.register("age")} aria-invalid={Boolean(errors.age)} />
            <FieldError message={errors.age?.message} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">¿Dónde compró su entrada?</legend>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Dónde compró">
          {(
            [
              { v: "punto_fisico", label: "Punto físico", hint: "Se le entrega la pulsera en ese momento", icon: MapPin },
              { v: "mensaje", label: "Por mensaje", hint: "WhatsApp o DM · la pulsera queda pendiente", icon: MessageCircle },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={saleSource === o.v}
              onClick={() => pickSource(o.v)}
              className={cn("rounded-xl border p-3 text-left text-sm", saleSource === o.v ? "border-olive bg-accent/60" : "border-border")}
            >
              <span className="flex items-center gap-2 font-medium">
                <o.icon className="size-4 text-olive" /> {o.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{o.hint}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-[var(--olive)]" {...form.register("wristbandDelivered")} />
          Pulsera entregada
          <span className="text-xs text-muted-foreground">({delivered ? "entregada" : "pendiente de entregar"})</span>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Entrada y pago</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Pago">
          {(
            [
              { v: "paid", label: "Pagada", hint: "Pago recibido", icon: Receipt },
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
        <div className="grid gap-4 sm:grid-cols-3">
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
            <Label>Total</Label>
            <p className="flex h-10 items-center text-lg font-semibold tabular-nums">
              {mode === "complimentary" ? "$0 (cortesía)" : formatMoney(type?.priceCents ?? 0)}
            </p>
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
            <FieldError message={errors.paymentMethod?.message} />
          </div>
        )}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="notes">{mode === "complimentary" ? "Motivo de la cortesía (obligatorio)" : "Notas internas"}</Label>
        <Textarea id="notes" rows={2} {...form.register("notes")} />
        <FieldError message={errors.notes?.message} />
      </div>

      <Button type="submit" disabled={pending} className="h-11 rounded-full px-6">
        {pending && <Loader2 className="animate-spin" />}
        Registrar y enviar correo
      </Button>
    </form>
  );
}
