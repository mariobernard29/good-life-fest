export const CATEGORY_LABEL: Record<string, string> = {
  capacity_full: "Clase o conferencia completa",
  exceptional_access: "Solicitud de acceso excepcional",
  payment_issue: "Problema con pago",
  ticket_error: "Error de boleto",
  reservation_change: "Cambio de reserva",
  duplicate_registration: "Registro duplicado",
  other: "Otro",
};

export const PRIORITY: Record<string, { label: string; tone: "gray" | "olive" | "amber" | "red" }> = {
  low: { label: "Baja", tone: "gray" },
  medium: { label: "Media", tone: "olive" },
  high: { label: "Alta", tone: "amber" },
  urgent: { label: "Urgente", tone: "red" },
};

export const STATUS: Record<string, { label: string; tone: "gray" | "olive" | "amber" | "green" }> = {
  open: { label: "Abierta", tone: "amber" },
  in_progress: { label: "En curso", tone: "olive" },
  resolved: { label: "Resuelta", tone: "green" },
  closed: { label: "Cerrada", tone: "gray" },
};
