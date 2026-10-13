/**
 * Manejo centralizado de errores de negocio.
 * Las funciones SQL lanzan `GLF:<CODIGO>`; aquí se traducen a mensajes en español.
 */
export const ERROR_MESSAGES = {
  // Genéricos
  UNKNOWN: "Ocurrió un error inesperado. Intenta de nuevo en unos momentos.",
  VALIDATION: "Revisa los datos del formulario.",
  UNAUTHENTICATED: "Inicia sesión para continuar.",
  FORBIDDEN: "No tienes permiso para realizar esta acción.",
  RATE_LIMITED: "Demasiadas solicitudes. Espera un momento e intenta de nuevo.",
  NOT_CONFIGURED: "La plataforma aún no está configurada por completo.",
  NOT_FOUND: "No encontramos lo que buscas.",
  // Venta
  INVALID_ITEMS: "Selecciona al menos una entrada.",
  INVALID_EMAIL: "Ingresa un correo electrónico válido.",
  EVENT_NOT_ON_SALE: "La venta de entradas no está disponible en este momento.",
  TICKET_TYPE_NOT_FOUND: "El tipo de entrada no existe.",
  TICKET_TYPE_NOT_ON_SALE: "Este tipo de entrada no está a la venta.",
  SALES_NOT_STARTED: "La venta de este tipo de entrada aún no comienza.",
  SALES_ENDED: "La venta de este tipo de entrada ya terminó.",
  QUANTITY_LIMIT: "Superaste el máximo de entradas permitidas por compra.",
  INSUFFICIENT_INVENTORY: "No hay suficientes entradas disponibles.",
  EVENT_CAPACITY_REACHED: "Se alcanzó la capacidad máxima del festival.",
  ORDER_NOT_FOUND: "No encontramos el pedido.",
  ORDER_STATE_INVALID: "El pedido no está en un estado válido para esta operación.",
  INVALID_STATUS: "Estado no válido.",
  INVALID_PAYMENT_METHOD: "Selecciona una forma de pago válida.",
  FORBIDDEN_COMPLIMENTARY: "No tienes permiso para emitir cortesías.",
  COMPLIMENTARY_REASON_REQUIRED: "Indica el motivo de la cortesía (mínimo 5 caracteres).",
  // Boletos
  TICKET_NOT_FOUND: "No encontramos el boleto.",
  TICKET_NOT_OWNED: "Ese boleto no pertenece a tu cuenta.",
  TICKET_WRONG_EVENT: "El boleto no corresponde a este evento.",
  TICKET_NOT_VALID: "El boleto no está activo.",
  // Reservas
  INVALID_SESSION: "Sesión no válida.",
  SESSION_NOT_FOUND: "La sesión no existe.",
  SESSION_NOT_BOOKABLE: "Esta sesión no admite reservas en este momento.",
  RESERVATION_NOT_REQUIRED: "Esta sesión es de acceso libre, no requiere reserva.",
  SESSION_STARTED: "La sesión ya comenzó.",
  RESERVATIONS_CLOSED: "Las reservas están cerradas por el momento.",
  TICKET_REQUIRED: "Necesitas una entrada válida para reservar.",
  ALREADY_RESERVED: "Ya tienes una reserva para esta sesión.",
  SCHEDULE_CONFLICT: "Tienes otra reserva en el mismo horario.",
  RESERVATION_LIMIT: "Alcanzaste el máximo de reservas permitidas.",
  SESSION_FULL: "La sesión está llena.",
  RESERVATION_NOT_FOUND: "No encontramos la reserva.",
  CANCELLATION_WINDOW_CLOSED: "El plazo para cancelar esta reserva ya cerró.",
  INVALID_CAPACITY: "El cupo debe ser un número mayor o igual a cero.",
  CAPACITY_BELOW_RESERVATIONS:
    "El nuevo cupo es menor que las reservas confirmadas. Elige cómo resolverlo antes de guardar.",
  INVALID_RESOLUTION: "Resolución no válida.",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly detail?: string;

  constructor(code: ErrorCode, detail?: string, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
    this.detail = detail;
  }
}

export function isErrorCode(value: string): value is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, value);
}

/** Mensaje seguro para mostrar al usuario (nunca expone detalles internos). */
export function userMessage(error: unknown): string {
  if (error instanceof AppError) {
    if (error.code === "INSUFFICIENT_INVENTORY" && error.detail !== undefined) {
      const left = Number(error.detail);
      return left > 0
        ? `Solo quedan ${left} entradas disponibles de este tipo.`
        : "Este tipo de entrada está agotado.";
    }
    if (error.code === "QUANTITY_LIMIT" && error.detail) {
      return `Puedes comprar máximo ${error.detail} entradas de este tipo por pedido.`;
    }
    if (error.code === "CAPACITY_BELOW_RESERVATIONS" && error.detail) {
      return `Hay ${error.detail} reservas confirmadas; el nuevo cupo es menor. Elige cómo resolverlo.`;
    }
    return error.message;
  }
  return ERROR_MESSAGES.UNKNOWN;
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; code?: ErrorCode; fieldErrors?: Record<string, string[] | undefined> };

/** Log sin datos personales: solo código y mensaje técnico. */
export function logError(context: string, error: unknown) {
  if (error instanceof AppError) {
    if (error.code === "UNKNOWN") console.error(`[${context}]`, error.code, error.detail ?? "");
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, message.slice(0, 500));
}
