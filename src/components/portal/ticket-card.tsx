"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Pencil, Ticket, Watch } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateAttendeeNameAction } from "@/app/mi-cuenta/actions";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types";

const STATUS: Record<TicketStatus, { label: string; className: string }> = {
  valid: { label: "Activo", className: "bg-success/15 text-success" },
  checked_in: { label: "Activo", className: "bg-success/15 text-success" },
  pending_payment: { label: "Pago pendiente", className: "bg-warning/15 text-warning" },
  cancelled: { label: "Cancelado", className: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", className: "bg-destructive/10 text-destructive" },
};

export type TicketCardData = {
  id: string;
  code: string;
  attendeeName: string;
  typeName: string;
  status: TicketStatus;
  wristbandDeliveredAt: string | null;
  eventName: string;
  eventDates: string;
};

/** Boleto virtual: comprobante de compra. El acceso al festival es con la pulsera física. */
export function TicketCard({ t }: { t: TicketCardData }) {
  const active = t.status === "valid" || t.status === "checked_in";
  return (
    <article className={cn("overflow-hidden rounded-3xl border border-border bg-card", !active && "opacity-75")}>
      <div className="flex items-start justify-between gap-3 bg-ink px-5 py-5 text-cream">
        <div>
          <p className="text-[0.65rem] tracking-[0.25em] text-cream/60 uppercase">Boleto virtual · {t.eventName}</p>
          <p className="display mt-1 text-3xl leading-tight">{t.typeName}</p>
        </div>
        <Badge className={cn("shrink-0 rounded-full border-0", STATUS[t.status].className)}>{STATUS[t.status].label}</Badge>
      </div>

      {/* Línea de corte del boleto */}
      <div className="relative h-0 border-t border-dashed border-border">
        <span className="absolute -top-3 -left-3 size-6 rounded-full bg-background" />
        <span className="absolute -top-3 -right-3 size-6 rounded-full bg-background" />
      </div>

      <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Asistente</dt>
          <dd className="flex items-center gap-2 text-lg font-medium">
            {t.attendeeName || "Sin nombre"} {t.status === "valid" && <EditName ticketId={t.id} current={t.attendeeName} />}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Folio</dt>
          <dd className="flex items-center gap-1.5 font-mono tracking-wider">
            <Ticket className="size-3.5 text-olive" /> {t.code}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fecha</dt>
          <dd className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-olive" /> {t.eventDates}
          </dd>
        </div>
      </dl>

      {active ? (
        <div className={cn("mx-5 mb-5 flex items-start gap-3 rounded-2xl p-4 text-sm", t.wristbandDeliveredAt ? "bg-success/10 text-success" : "bg-warning/10 text-foreground")}>
          <Watch className={cn("mt-0.5 size-5 shrink-0", !t.wristbandDeliveredAt && "text-warning")} />
          {t.wristbandDeliveredAt ? (
            <p>
              <span className="font-medium">Pulsera entregada.</span> Llévala puesta el día del festival: es tu entrada.
            </p>
          ) : (
            <p>
              <span className="font-medium">Pulsera pendiente.</span> Recógela en el módulo de pulseras el día del evento antes de empezar; da tu nombre o el folio de este boleto.
            </p>
          )}
        </div>
      ) : (
        <p className="mx-5 mb-5 rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
          {t.status === "pending_payment" ? "Tu boleto se activa al confirmar el pago." : "Este boleto ya no es válido."}
        </p>
      )}
    </article>
  );
}

function EditName({ ticketId, current }: { ticketId: string; current: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(current);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-xs" variant="ghost" aria-label="Editar nombre del asistente">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nombre del asistente</DialogTitle>
          <DialogDescription>Con este nombre te buscaremos al entregarte tu pulsera.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await updateAttendeeNameAction({ ticketId, attendeeName: name });
              if (res.ok) {
                toast.success(res.message);
                setOpen(false);
              } else toast.error(res.error);
            });
          }}
          className="space-y-4"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11" maxLength={120} required minLength={2} />
          <Button type="submit" className="w-full rounded-full" disabled={pending}>
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
