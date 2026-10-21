import { describe, expect, it } from "vitest";
import { buildQrPayload, parseTicketInput, renderQrSvg } from "@/lib/tickets/qr";
import { formatMoney, utcToZonedLocal, zonedLocalToUtc, dayKey } from "@/lib/format";
import { assignableRoles, resolvePermissions, staffHome } from "@/lib/auth/permissions";
import { checkoutSchema, manualSaleSchema, ticketTypeSchema } from "@/lib/validation/schemas";
import { toAppError } from "@/lib/db/rpc";
import { userMessage } from "@/lib/errors";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("QR", () => {
  const token = "a".repeat(64);
  it("el contenido no incluye datos personales y se interpreta de vuelta", async () => {
    const payload = buildQrPayload(token);
    expect(payload).toBe(`GLF1:${token}`);
    expect(parseTicketInput(payload)).toEqual({ kind: "token", token });
    expect(parseTicketInput(" gl-abcde-12345 ")).toEqual({ kind: "code", code: "GL-ABCDE-12345" });
    expect(parseTicketInput("GLF1:corto")).toBeNull();
    expect(parseTicketInput("https://malicioso.example")).toBeNull();
    const svg = await renderQrSvg(payload);
    expect(svg).toContain("<svg");
  });
});

describe("Formato y zona horaria America/Mazatlan", () => {
  it("convierte hora local del evento a UTC y de regreso", () => {
    expect(zonedLocalToUtc("2027-03-20T08:00", "America/Mazatlan")).toBe("2027-03-20T15:00:00.000Z");
    expect(utcToZonedLocal("2027-03-20T15:00:00.000Z", "America/Mazatlan")).toBe("2027-03-20T08:00");
    expect(dayKey("2027-03-21T05:30:00.000Z", "America/Mazatlan")).toBe("2027-03-20");
  });
  it("formatea MXN desde centavos", () => {
    expect(formatMoney(150000)).toMatch(/\$1,500/);
  });
});

describe("Permisos", () => {
  it("cada rol obtiene solo lo necesario", () => {
    const checkin = resolvePermissions([{ role: "checkin_staff", permissions: [] }]);
    expect([...checkin]).toEqual(["checkin.perform", "wristbands.manage"]);
    expect(staffHome(checkin)).toBe("/pulseras");

    const ticketing = resolvePermissions([{ role: "ticketing_staff", permissions: [] }]);
    expect(ticketing.has("sales.manual")).toBe(true);
    expect(ticketing.has("sales.complimentary")).toBe(false);
    expect(ticketing.has("staff.manage")).toBe(false);
    expect(ticketing.has("participants.register")).toBe(true);
    expect(ticketing.has("exports.download")).toBe(false);
    expect(ticketing.has("notifications.send")).toBe(false);

    const withExtra = resolvePermissions([{ role: "ticketing_staff", permissions: ["issue_complimentary", "desconocido"] }]);
    expect(withExtra.has("sales.complimentary")).toBe(true);

    expect(assignableRoles(["event_admin"])).not.toContain("super_admin");
    expect(assignableRoles(["checkin_staff"])).toEqual([]);
  });
});

describe("Validación", () => {
  it("checkout exige términos, correo válido y al menos una entrada", () => {
    const base = {
      items: [{ ticketTypeId: "7f1b3c1e-8a3b-4c3b-9a43-3b2a1c0d9e8f", quantity: 0 }],
      buyerName: "Ana",
      buyerEmail: "ANA@Correo.MX",
      acceptTerms: true,
    };
    expect(checkoutSchema.safeParse(base).success).toBe(false);
    const ok = checkoutSchema.parse({ ...base, items: [{ ...base.items[0], quantity: 2 }] });
    expect(ok.buyerEmail).toBe("ana@correo.mx");
    expect(checkoutSchema.safeParse({ ...base, items: [{ ...base.items[0], quantity: 2 }], acceptTerms: false }).success).toBe(false);
  });
  it("venta manual: cortesía requiere motivo; pago requiere forma de pago", () => {
    const base = {
      ticketTypeId: "7f1b3c1e-8a3b-4c3b-9a43-3b2a1c0d9e8f", quantity: 1, buyerName: "Ana",
      buyerEmail: "ana@correo.mx", attendees: [],
    };
    expect(manualSaleSchema.safeParse({ ...base, mode: "complimentary", notes: "" }).success).toBe(false);
    expect(manualSaleSchema.safeParse({ ...base, mode: "paid" }).success).toBe(false);
    expect(manualSaleSchema.safeParse({ ...base, mode: "paid", paymentMethod: "cash" }).success).toBe(true);
  });
  it("no permite venta en línea de entradas gratuitas", () => {
    const r = ticketTypeSchema.safeParse({ name: "Gratis", priceMxn: 0, quantityTotal: 10, maxPerOrder: 2, saleStatus: "on_sale" });
    expect(r.success).toBe(false);
  });
});

describe("Errores", () => {
  it("traduce errores de PostgreSQL a mensajes en español sin filtrar detalles internos", () => {
    const e = toAppError({ message: "GLF:INSUFFICIENT_INVENTORY", details: "1" });
    expect(e.code).toBe("INSUFFICIENT_INVENTORY");
    expect(userMessage(e)).toBe("Solo quedan 1 entradas disponibles de este tipo.");
    expect(userMessage(toAppError({ message: 'relation "x" does not exist' }))).toMatch(/inesperado/);
  });
});

describe("Rate limiting", () => {
  it("bloquea al superar el límite dentro de la ventana", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 2, 1000, 0)).toBe(true);
    expect(checkRateLimit(key, 2, 1000, 10)).toBe(true);
    expect(checkRateLimit(key, 2, 1000, 20)).toBe(false);
    expect(checkRateLimit(key, 2, 1000, 1001)).toBe(true);
  });
});
