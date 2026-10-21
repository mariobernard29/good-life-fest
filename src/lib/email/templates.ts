import { FEST } from "@/content/festival";

/**
 * Plantillas de correo transaccional. HTML simple con estilos en línea (los
 * clientes de correo ignoran hojas de estilo) y versión de texto plano.
 */
export type EmailContent = { subject: string; html: string; text: string };

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

function layout(opts: { greeting: string; paragraphs: string[]; cta: string; url: string; footer: string }) {
  const body = opts.paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escape(p)}</p>`).join("");
  return `<!doctype html>
<html lang="es">
<body style="margin:0;background:#f8f4ed;font-family:Helvetica,Arial,sans-serif;color:#2f3327">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:24px;padding:36px 32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#4f5b36">${escape(FEST.name)}</p>
          <h1 style="margin:0 0 24px;font-size:26px;font-weight:600">${escape(opts.greeting)}</h1>
          ${body}
          <p style="margin:28px 0">
            <a href="${escape(opts.url)}" style="display:inline-block;background:#4f5b36;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">${escape(opts.cta)}</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6f6f66;line-height:1.5">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
          <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#4f5b36">${escape(opts.url)}</p>
          <p style="margin:0;font-size:12px;color:#8a8a80;line-height:1.5">${escape(opts.footer)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "";
}

/** Bienvenida tras el registro manual: el enlace lleva a crear la contraseña. */
export function activationEmail({ name, url }: { name: string; url: string }): EmailContent {
  const hi = firstName(name) ? `¡Hola, ${firstName(name)}!` : "¡Hola!";
  const paragraphs = [
    `Ya tienes tu entrada para ${FEST.name} (${FEST.date}).`,
    "Confirma tu correo y crea tu contraseña para entrar a tu portal: ahí verás tu boleto virtual, podrás apartar tu lugar en las clases y actividades y activar los avisos del festival.",
  ];
  const footer = "El enlace es personal y vence en 24 horas. Si no compraste una entrada, ignora este correo.";
  return {
    subject: `Activa tu cuenta · ${FEST.name}`,
    html: layout({ greeting: hi, paragraphs, cta: "Crear mi contraseña", url, footer }),
    text: [hi, "", ...paragraphs, "", `Crear mi contraseña: ${url}`, "", footer].join("\n"),
  };
}

/** Recuperación de contraseña (o reenvío de activación si la cuenta no se ha activado). */
export function recoveryEmail({ name, url, activation }: { name: string; url: string; activation: boolean }): EmailContent {
  if (activation) return activationEmail({ name, url });
  const hi = firstName(name) ? `Hola, ${firstName(name)}` : "Hola";
  const paragraphs = ["Recibimos una solicitud para restablecer la contraseña de tu cuenta.", "Usa el botón para crear una nueva."];
  const footer = "El enlace vence pronto y solo funciona una vez. Si no lo pediste, ignora este correo: tu contraseña no cambia.";
  return {
    subject: `Restablece tu contraseña · ${FEST.name}`,
    html: layout({ greeting: hi, paragraphs, cta: "Crear nueva contraseña", url, footer }),
    text: [hi, "", ...paragraphs, "", `Crear nueva contraseña: ${url}`, "", footer].join("\n"),
  };
}
