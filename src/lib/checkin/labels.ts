import type { CheckInResult } from "@/lib/types";

export const CHECK_IN_LABELS: Record<CheckInResult, { title: string; tone: "success" | "warning" | "error" }> = {
  accepted: { title: "Acceso autorizado", tone: "success" },
  already_used: { title: "Boleto ya utilizado", tone: "warning" },
  invalid: { title: "Boleto inválido", tone: "error" },
  payment_pending: { title: "Pago pendiente", tone: "warning" },
  cancelled: { title: "Boleto cancelado", tone: "error" },
  refunded: { title: "Boleto reembolsado", tone: "error" },
  wrong_event: { title: "Boleto de otro evento", tone: "error" },
  not_allowed: { title: "Acceso no incluido en la entrada", tone: "error" },
};
