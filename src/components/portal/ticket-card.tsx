"use client";

import { useState, useTransition } from "react";
import { Maximize2, Pencil, Sun } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateAttendeeNameAction } from "@/app/mi-cuenta/actions";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types";

const STATUS: Record<TicketStatus, { label: string; className: string }> = {
  valid: { label: "Válido", className: "bg-success/15 text-success" },
  checked_in: { label: "Utilizado", className: "bg-secondary text-muted-foreground" },
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
  qrSvg: string | null;
  checkedInAt: string | null;
  eventName: string;
  eventDates: string;
};

export function TicketCard({ t }: { t: TicketCardData }) {
  const usable = t.status === "valid";
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 bg-ink px-5 py-4 text-cream">
        <div>
          <p className="text-[0.65rem] tracking-[0.25em] text-cream/60 uppercase">{t.eventName}</p>
          <p className="display text-2xl leading-tight">{t.typeName}</p>
        </div>
        <Badge className={cn("rounded-full border-0", STATUS[t.status].className)}>{STATUS[t.status].label}</Badge>
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:items-center">
        {t.qrSvg && usable ? (
          <FullscreenQr t={t}>
            <button type="button" className="group relative mx-auto block w-44 rounded-2xl bg-white p-3 ring-1 ring-border" aria-label="Abrir código QR en pantalla completa">
              <span className="block [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: t.qrSvg }} />
              <span className="absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-ink text-cream opacity-90">
                <Maximize2 className="size-3.5" />
              </span>
            </button>
          </FullscreenQr>
        ) : (
          <div className="mx-auto grid size-44 place-items-center rounded-2xl bg-secondary p-4 text-center text-sm text-muted-foreground">
            {t.status === "checked_in" ? "Acceso registrado" : t.status === "pending_payment" ? "Disponible al confirmar el pago" : "Boleto sin acceso"}
          </div>
        )}
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Asistente</dt>
            <dd className="flex items-center gap-2 font-medium">
              {t.attendeeName || "Sin nombre"} {usable && <EditName ticketId={t.id} current={t.attendeeName} />}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Código</dt>
            <dd className="font-mono tracking-wider">{t.code}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Fechas</dt>
            <dd>{t.eventDates}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function FullscreenQr({ t, children }: { t: TicketCardData; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-[100dvh] max-h-none w-screen max-w-none rounded-none border-0 bg-white p-6 sm:h-auto sm:max-w-md sm:rounded-3xl">
        <DialogHeader className="text-center">
          <DialogTitle className="display text-3xl text-ink">{t.typeName}</DialogTitle>
          <DialogDescription className="text-ink/70">{t.attendeeName}</DialogDescription>
        </DialogHeader>
        <div className="mx-auto flex w-full max-w-[min(88vw,420px)] flex-1 flex-col items-center justify-center gap-5">
          <div className="w-full bg-white [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: t.qrSvg ?? "" }} />
          <p className="font-mono text-xl tracking-[0.2em] text-ink">{t.code}</p>
          <p className="flex items-center gap-2 text-xs text-ink/60">
            <Sun className="size-4" /> Sube el brillo de tu pantalla para escanear más rápido.
          </p>
        </div>
      </DialogContent>
    </Dialog>
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
          <DialogDescription>Este nombre aparecerá al validar el boleto en la entrada.</DialogDescription>
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
