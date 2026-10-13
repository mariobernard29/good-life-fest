"use client";

import { useTransition } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelPurchaseAction, simulatePaymentAction } from "@/app/(public)/comprar/actions";

export function PaymentActions({ orderId, totalLabel }: { orderId: string; totalLabel: string }) {
  const [paying, startPay] = useTransition();
  const [cancelling, startCancel] = useTransition();
  return (
    <div className="space-y-3">
      <Button
        size="lg"
        className="h-12 w-full rounded-full text-base"
        disabled={paying || cancelling}
        onClick={() =>
          startPay(async () => {
            const res = await simulatePaymentAction(orderId);
            if (res && !res.ok) toast.error(res.error);
          })
        }
      >
        {paying ? <Loader2 className="animate-spin" /> : <CreditCard />}
        {paying ? "Procesando…" : `Pagar ${totalLabel} (simulado)`}
      </Button>
      <Button
        variant="ghost"
        className="w-full rounded-full"
        disabled={paying || cancelling}
        onClick={() =>
          startCancel(async () => {
            const res = await cancelPurchaseAction(orderId);
            if (res && !res.ok) toast.error(res.error);
          })
        }
      >
        {cancelling && <Loader2 className="animate-spin" />} Cancelar y liberar entradas
      </Button>
    </div>
  );
}
