import QRCode from "qrcode";

/**
 * Contenido del QR: prefijo de versión + token aleatorio de 64 hex (≈244 bits).
 * No incluye nombre, correo ni ningún dato personal; el servidor resuelve el
 * token contra la base de datos en cada validación.
 */
const QR_PREFIX = "GLF1:";
const TOKEN_RE = /^[a-f0-9]{64}$/;
const CODE_RE = /^GL-[A-F0-9]{5}-[A-F0-9]{5}$/;

export function buildQrPayload(token: string): string {
  return `${QR_PREFIX}${token}`;
}

export type ParsedTicketInput = { kind: "token"; token: string } | { kind: "code"; code: string } | null;

/** Interpreta lo leído por el escáner o tecleado por el personal. */
export function parseTicketInput(raw: string): ParsedTicketInput {
  const value = raw.trim();
  if (value.startsWith(QR_PREFIX)) {
    const token = value.slice(QR_PREFIX.length).toLowerCase();
    return TOKEN_RE.test(token) ? { kind: "token", token } : null;
  }
  const code = value.toUpperCase().replace(/\s+/g, "");
  if (CODE_RE.test(code)) return { kind: "code", code };
  return null;
}

export async function renderQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#1c211b", light: "#ffffff" },
  });
}
