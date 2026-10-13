"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelReservationAction } from "@/app/mi-cuenta/actions";

export function CancelReservationButton({ reservationId, disabledReason }: { reservationId: string; disabledReason?: string }) {
  const [pending, start] = useTransition();
  if (disabledReason) return <span className="text-xs text-muted-foreground">{disabledReason}</span>;
  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-full"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Cancelar esta reserva? Tu lugar se liberará para otra persona.")) return;
        start(async () => {
          const res = await cancelReservationAction({ reservationId });
          if (res.ok) toast.success(res.message);
          else toast.error(res.error);
        });
      }}
    >
      {pending && <Loader2 className="animate-spin" />} Cancelar
    </Button>
  );
}
