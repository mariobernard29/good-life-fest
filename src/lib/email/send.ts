import "server-only";
import { Resend } from "resend";
import { getAppEnv, getEmailConfig } from "@/lib/env";
import { AppError, logError } from "@/lib/errors";
import type { EmailContent } from "@/lib/email/templates";

let client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}

/**
 * Envía un correo transaccional con Resend.
 * Sin configuración: en desarrollo solo lo registra en la consola (para probar
 * los enlaces localmente); en producción lanza NOT_CONFIGURED.
 */
export async function sendEmail(to: string, content: EmailContent): Promise<{ sent: boolean }> {
  const config = getEmailConfig();
  if (!config) {
    if (getAppEnv() !== "production") {
      console.info(`[email:dev] Para ${to} · ${content.subject}\n${content.text}`);
      return { sent: false };
    }
    throw new AppError("NOT_CONFIGURED", "RESEND_API_KEY/EMAIL_FROM");
  }
  client ??= new Resend(config.apiKey);
  const { error } = await client.emails.send({
    from: config.from,
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });
  if (error) {
    logError("sendEmail", new Error(`${error.name}: ${error.message}`));
    throw new AppError("EMAIL_NOT_SENT");
  }
  return { sent: true };
}
