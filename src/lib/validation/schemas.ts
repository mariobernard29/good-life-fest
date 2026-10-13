import { z } from "zod";

/** Esquemas Zod compartidos entre formularios (cliente) y Server Actions (servidor). */

const name = z.string().trim().min(2, "Ingresa al menos 2 caracteres").max(120, "Máximo 120 caracteres");
const email = z.string().trim().toLowerCase().pipe(z.email("Correo electrónico inválido")).pipe(z.string().max(254));
const phone = z
  .string()
  .trim()
  .max(30, "Teléfono demasiado largo")
  .regex(/^[0-9+()\s-]*$/, "Teléfono inválido")
  .optional()
  .or(z.literal("").transform(() => undefined));
const uuid = z.uuid("Identificador inválido");
const optionalText = (max: number) => z.string().trim().max(max).optional().default("");
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "Fecha y hora inválidas");
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//.test(v), "URL inválida (debe iniciar con https://)")
  .optional()
  .default("");
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal(true), z.literal("false"), z.literal(false), z.undefined(), z.null()])
  .transform((v) => v === "on" || v === "true" || v === true);

// --- Compra ------------------------------------------------------------------
export const checkoutSchema = z.object({
  items: z
    .array(z.object({ ticketTypeId: uuid, quantity: z.number().int().min(0).max(50) }))
    .transform((items) => items.filter((i) => i.quantity > 0))
    .refine((items) => items.length > 0, "Selecciona al menos una entrada"),
  buyerName: name,
  buyerEmail: email,
  buyerPhone: phone,
  acceptTerms: z.literal(true, { error: "Debes aceptar los términos y condiciones" }),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

/** Compra con sesión iniciada: el comprador es la cuenta; el cliente solo envía cantidades. */
export const purchaseSchema = z.object({
  items: z
    .array(z.object({ ticketTypeId: uuid, quantity: z.number().int().min(0).max(50) }))
    .transform((items) => items.filter((i) => i.quantity > 0))
    .refine((items) => items.length > 0, "Selecciona al menos una entrada"),
  acceptTerms: z.literal(true, { error: "Debes aceptar los términos y condiciones" }),
});
export type PurchaseInput = z.input<typeof purchaseSchema>;

// --- Autenticación -----------------------------------------------------------
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Ingresa tu contraseña").max(200),
  next: z.string().optional(),
});

export const registerSchema = z
  .object({
    fullName: name,
    email,
    phone,
    password: z.string().min(8, "Mínimo 8 caracteres").max(200),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Las contraseñas no coinciden" });

export const recoverSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({ password: z.string().min(8, "Mínimo 8 caracteres").max(200), confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Las contraseñas no coinciden" });

export const profileSchema = z.object({ fullName: name, phone });

export const ticketAttendeeSchema = z.object({ ticketId: uuid, attendeeName: name });

// --- Reservas ----------------------------------------------------------------
export const reservationSchema = z.object({
  kind: z.enum(["activity", "conference"]),
  sessionId: uuid,
  ticketId: uuid.nullable(),
});

export const cancelReservationSchema = z.object({ reservationId: uuid });

// --- Check-in ----------------------------------------------------------------
export const checkInSchema = z.object({
  input: z.string().trim().min(3).max(200),
  accessArea: z.string().trim().min(1).max(40).default("general"),
  method: z.enum(["scan", "manual"]).default("scan"),
});

export const checkInSearchSchema = z.object({ query: z.string().trim().min(3, "Escribe al menos 3 caracteres").max(120) });

// --- Venta manual ------------------------------------------------------------
export const PAYMENT_METHODS = ["cash", "card_terminal", "transfer"] as const;
export const manualSaleSchema = z
  .object({
    ticketTypeId: uuid,
    quantity: z.coerce.number().int().min(1).max(50),
    buyerName: name,
    buyerEmail: email,
    buyerPhone: phone,
    attendees: z.array(z.object({ name: z.string().trim().max(120), email: z.string().trim().max(254).optional() })),
    mode: z.enum(["paid", "pending", "complimentary"]),
    paymentMethod: z.enum(PAYMENT_METHODS).optional(),
    notes: z.string().trim().max(1000).optional().default(""),
  })
  .superRefine((d, ctx) => {
    if (d.mode !== "complimentary" && !d.paymentMethod) {
      ctx.addIssue({ code: "custom", path: ["paymentMethod"], message: "Selecciona la forma de pago" });
    }
    if (d.mode === "complimentary" && d.notes.length < 5) {
      ctx.addIssue({ code: "custom", path: ["notes"], message: "Indica el motivo de la cortesía" });
    }
    d.attendees.forEach((a, i) => {
      if (a.email && !z.email().safeParse(a.email).success) {
        ctx.addIssue({ code: "custom", path: ["attendees", i, "email"], message: "Correo inválido" });
      }
    });
  });
export type ManualSaleInput = z.input<typeof manualSaleSchema>;

// --- Administración ----------------------------------------------------------
export const ticketTypeSchema = z
  .object({
    id: uuid.optional(),
    name,
    description: optionalText(2000),
    priceMxn: z.coerce.number().min(0).max(1_000_000),
    quantityTotal: z.coerce.number().int().min(0).max(1_000_000),
    maxPerOrder: z.coerce.number().int().min(1).max(50),
    benefits: z.string().max(4000).optional().default(""),
    accessAreas: z.string().max(400).optional().default("general"),
    saleStatus: z.enum(["draft", "on_sale", "box_office_only", "paused", "closed"]),
    salesStartAt: localDateTime.optional().or(z.literal("")),
    salesEndAt: localDateTime.optional().or(z.literal("")),
    sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  })
  .refine((d) => !(d.saleStatus === "on_sale" && d.priceMxn === 0), {
    path: ["saleStatus"],
    message: "Las entradas gratuitas se emiten como cortesía o en taquilla",
  });

const sessionBase = {
  id: uuid.optional(),
  description: optionalText(4000),
  startsAt: localDateTime,
  endsAt: localDateTime,
  location: optionalText(160),
  capacity: z.coerce.number().int().min(0).max(100_000),
  status: z.enum(["draft", "published", "closed", "cancelled"]),
  requiresTicket: checkbox,
  waitlistEnabled: checkbox,
  cancellationCutoffMinutes: z.coerce.number().int().min(0).max(10_080).default(60),
  capacityResolution: z.enum(["", "keep_existing", "move_excess_to_waitlist"]).optional().default(""),
};

export const activitySchema = z
  .object({
    ...sessionBase,
    name,
    category: z.string().trim().min(2).max(60),
    instructor: optionalText(120),
    instructorBio: optionalText(2000),
    imageUrl: optionalUrl,
  })
  .refine((d) => d.endsAt > d.startsAt, { path: ["endsAt"], message: "La hora de fin debe ser posterior al inicio" });

export const conferenceSchema = z
  .object({
    ...sessionBase,
    title: z.string().trim().min(2).max(200),
    speakerName: optionalText(120),
    speakerBio: optionalText(4000),
    speakerPhotoUrl: optionalUrl,
    requiresReservation: checkbox,
  })
  .refine((d) => d.endsAt > d.startsAt, { path: ["endsAt"], message: "La hora de fin debe ser posterior al inicio" });

export const INCIDENT_CATEGORIES = [
  "capacity_full",
  "exceptional_access",
  "payment_issue",
  "ticket_error",
  "reservation_change",
  "duplicate_registration",
  "other",
] as const;
export const INCIDENT_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const INCIDENT_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export const incidentCreateSchema = z.object({
  category: z.enum(INCIDENT_CATEGORIES),
  title: z.string().trim().min(3).max(160),
  description: optionalText(4000),
  priority: z.enum(INCIDENT_PRIORITIES),
  ticketCode: z.string().trim().max(20).optional().default(""),
});

export const incidentUpdateSchema = z.object({
  incidentId: uuid,
  status: z.enum(INCIDENT_STATUSES),
  priority: z.enum(INCIDENT_PRIORITIES),
  assignedTo: uuid.optional().or(z.literal("")),
  note: optionalText(4000),
  resolution: optionalText(4000),
});

export const sponsorSchema = z.object({
  id: uuid.optional(),
  name,
  tier: z.string().trim().min(2).max(40),
  description: optionalText(2000),
  logoUrl: optionalUrl,
  websiteUrl: optionalUrl,
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isPublished: checkbox,
});

export const exhibitorSchema = z.object({
  id: uuid.optional(),
  name,
  category: z.string().trim().min(2).max(60),
  description: optionalText(2000),
  logoUrl: optionalUrl,
  websiteUrl: optionalUrl,
  booth: optionalText(40),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isPublished: checkbox,
});

export const staffInviteSchema = z.object({
  email,
  role: z.enum(["super_admin", "event_admin", "ticketing_staff", "checkin_staff"]),
  issueComplimentary: checkbox,
});

export const eventSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    description: optionalText(4000),
    locationName: optionalText(160),
    address: optionalText(300),
    startsAt: localDateTime,
    endsAt: localDateTime,
    maxCapacity: z.coerce.number().int().min(1).max(1_000_000),
    status: z.enum(["draft", "published", "closed", "archived"]),
    onlineSalesEnabled: checkbox,
    reservationsOpen: checkbox,
    maxReservationsPerTicket: z.coerce.number().int().min(0).max(100).default(0),
    contactEmail: z.string().trim().max(254).optional().default(""),
    contactWhatsapp: z.string().trim().max(30).optional().default(""),
    instagramUrl: optionalUrl,
    heroTagline: optionalText(200),
  })
  .refine((d) => d.endsAt > d.startsAt, { path: ["endsAt"], message: "La fecha de fin debe ser posterior al inicio" });

export const announcementSchema = z.object({ title: z.string().trim().min(2).max(160), body: optionalText(2000) });
export const faqSchema = z.object({
  question: z.string().trim().min(3).max(300),
  answer: z.string().trim().min(1).max(4000),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

/** FormData -> objeto plano (los campos repetidos se vuelven arreglos). */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    const v = typeof value === "string" ? value : value.name;
    if (key in out) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, v] : [prev, v];
    } else {
      out[key] = v;
    }
  }
  return out;
}

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
