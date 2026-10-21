"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCircle2, Loader2, MailPlus, Trash2, Undo2, Watch, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/errors";
import { confirmPaymentAction, voidTicketAction } from "@/app/admin/_actions/sales";
import { adminCancelReservationAction, cancelSessionAction } from "@/app/admin/_actions/sessions";
import { deleteContentAction } from "@/app/admin/_actions/catalog";
import { deleteSettingItemAction, setDemoFlagAction, setStaffActiveAction } from "@/app/admin/_actions/operations";
import { resendActivationAction, setWristbandAction } from "@/app/admin/_actions/participants";
import { cancelNotificationAction } from "@/app/admin/_actions/notifications";

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, onOk?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Listo");
        onOk?.();
      } else toast.error(res.error);
    });
  return { pending, run };
}

export function ConfirmPaymentButton({ orderId }: { orderId: string }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => confirm("¿Confirmas que se recibió el pago? Los boletos se activarán.") && run(() => confirmPaymentAction(orderId))}
    >
      {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Confirmar pago
    </Button>
  );
}

export function VoidTicketButton({ ticketId }: { ticketId: string }) {
  const { pending, run } = useRun();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Ban /> Anular boleto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anular boleto</DialogTitle>
          <DialogDescription>El boleto quedará cancelado y se cancelarán sus reservas. Esta acción queda auditada. Si corresponde una devolución de dinero, gestiónala por separado.</DialogDescription>
        </DialogHeader>
        <Textarea placeholder="Motivo (obligatorio)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button variant="destructive" disabled={pending || reason.trim().length < 5} onClick={() => run(() => voidTicketAction(ticketId, reason), () => setOpen(false))}>
            {pending && <Loader2 className="animate-spin" />} Anular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CancelSessionButton({ kind, sessionId }: { kind: "activity" | "conference"; sessionId: string }) {
  const { pending, run } = useRun();
  return (
    <Button
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => confirm("¿Cancelar la sesión? Se cancelarán todas sus reservas activas.") && run(() => cancelSessionAction(kind, sessionId))}
    >
      {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancelar sesión
    </Button>
  );
}

export function AdminCancelReservationButton({ reservationId }: { reservationId: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => confirm("¿Cancelar esta reserva?") && run(() => adminCancelReservationAction(reservationId))}>
      {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancelar
    </Button>
  );
}

export function DeleteContentButton({ kind, id }: { kind: "sponsor" | "exhibitor"; id: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="icon-sm" variant="ghost" aria-label="Eliminar" disabled={pending} onClick={() => confirm("¿Eliminar este registro?") && run(() => deleteContentAction(kind, id))}>
      <Trash2 />
    </Button>
  );
}

export function DeleteSettingItemButton({ kind, id }: { kind: "announcement" | "faq"; id: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="icon-sm" variant="ghost" aria-label="Eliminar" disabled={pending} onClick={() => confirm("¿Eliminar?") && run(() => deleteSettingItemAction(kind, id))}>
      <Trash2 />
    </Button>
  );
}

export function StaffActiveToggle({ staffId, active }: { staffId: string; active: boolean }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" variant={active ? "outline" : "default"} disabled={pending} onClick={() => run(() => setStaffActiveAction(staffId, !active))}>
      {active ? "Desactivar" : "Reactivar"}
    </Button>
  );
}

export function DemoFlagToggle({ isDemo }: { isDemo: boolean }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setDemoFlagAction(!isDemo))}>
      {isDemo ? "Retirar aviso de demostración" : "Mostrar aviso de demostración"}
    </Button>
  );
}

/** Pulsera entregada / pendiente. `compact` muestra solo el botón principal (tablas). */
export function WristbandToggle({ ticketId, delivered, compact }: { ticketId: string; delivered: boolean; compact?: boolean }) {
  const { pending, run } = useRun();
  if (delivered) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className="text-muted-foreground"
        disabled={pending}
        onClick={() => confirm("¿Regresar la pulsera a pendiente?") && run(() => setWristbandAction(ticketId, false))}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Undo2 />} {compact ? "Deshacer" : "Marcar como pendiente"}
      </Button>
    );
  }
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setWristbandAction(ticketId, true))}>
      {pending ? <Loader2 className="animate-spin" /> : <Watch />} Entregar pulsera
    </Button>
  );
}

export function ResendActivationButton({ profileId }: { profileId: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resendActivationAction(profileId))}>
      {pending ? <Loader2 className="animate-spin" /> : <MailPlus />} Reenviar correo
    </Button>
  );
}

export function CancelNotificationButton({ id }: { id: string }) {
  const { pending, run } = useRun();
  return (
    <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => confirm("¿Cancelar este aviso programado?") && run(() => cancelNotificationAction(id))}>
      {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancelar
    </Button>
  );
}
