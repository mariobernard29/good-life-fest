"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { BellRing, Loader2, Share, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { removePushSubscriptionAction, savePushSubscriptionAction, sendTestNotificationAction } from "@/app/mi-cuenta/actions";
import { cn } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// "unavailable": el sitio aún no tiene llaves VAPID (no es culpa del navegador).
type Status = "loading" | "unavailable" | "unsupported" | "ios-install" | "default" | "denied" | "subscribed";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function serialize(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
    userAgent: navigator.userAgent.slice(0, 300),
  };
}

async function subscribe(reg: ServiceWorkerRegistration) {
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
  const res = await savePushSubscriptionAction(serialize(sub));
  if (!res.ok) throw new Error(res.error);
}

/** Registra el service worker y averigua el estado de las notificaciones en este dispositivo. */
async function detect(): Promise<{ status: Status; reg: ServiceWorkerRegistration | null }> {
  if (!VAPID_PUBLIC_KEY) return { status: "unavailable", reg: null };
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // En iPhone las notificaciones web solo existen con la app agregada a la pantalla de inicio.
    return { status: ios && !standalone ? "ios-install" : "unsupported", reg: null };
  }
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Re-vincula la suscripción a la cuenta con sesión (por si el navegador cambió de cuenta).
    void savePushSubscriptionAction(serialize(existing));
    return { status: "subscribed", reg };
  }
  if (Notification.permission === "denied") return { status: "denied", reg };
  if (Notification.permission === "granted") {
    try {
      await subscribe(reg);
      return { status: "subscribed", reg };
    } catch {
      return { status: "default", reg };
    }
  }
  return { status: "default", reg };
}

function usePush() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, start] = useTransition();
  const reg = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    let cancelled = false;
    detect()
      .then((r) => {
        reg.current = r.reg;
        if (!cancelled) setStatus(r.status);
      })
      .catch(() => !cancelled && setStatus("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = () => {
    // El permiso debe pedirse directo en el clic (Safari descarta el gesto tras un await).
    const permission = Notification.requestPermission();
    start(async () => {
      const result = await permission;
      if (result !== "granted") {
        setStatus(result === "denied" ? "denied" : "default");
        if (result === "denied") toast.error("Bloqueaste las notificaciones en este navegador.");
        return;
      }
      try {
        await subscribe(reg.current ?? (await navigator.serviceWorker.ready));
        setStatus("subscribed");
        toast.success("¡Listo! Te avisaremos antes de tus clases.");
      } catch (error) {
        toast.error(error instanceof Error && error.message ? error.message : "No pudimos activar las notificaciones. Intenta de nuevo.");
      }
    });
  };

  const disable = () =>
    start(async () => {
      const sub = await reg.current?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscriptionAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("default");
      toast.success("Notificaciones desactivadas en este dispositivo.");
    });

  const test = () =>
    start(async () => {
      const res = await sendTestNotificationAction();
      if (res.ok) toast.success(res.message ?? "Notificación enviada.");
      else toast.error(res.error);
    });

  return { status, busy, enable, disable, test };
}

function IosSteps() {
  return (
    <ol className="mt-2 space-y-1 text-sm text-foreground/75">
      <li className="flex items-center gap-2">
        <Share className="size-4 shrink-0 text-olive" /> 1. Toca <strong>Compartir</strong> en Safari.
      </li>
      <li className="flex items-center gap-2">
        <Smartphone className="size-4 shrink-0 text-olive" /> 2. Elige <strong>Agregar a inicio</strong> y abre la app desde ahí.
      </li>
      <li className="flex items-center gap-2">
        <BellRing className="size-4 shrink-0 text-olive" /> 3. Entra a Mi cuenta y activa las notificaciones.
      </li>
    </ol>
  );
}

/**
 * Tarjeta de Inicio: pide permiso para avisar antes de cada clase reservada y
 * durante el día del festival. Desaparece cuando ya están activas.
 */
export function NotificationsPrompt({ reminderMinutes, highlight = false }: { reminderMinutes: number; highlight?: boolean }) {
  const { status, busy, enable } = usePush();
  if (status === "loading" || status === "unavailable" || status === "unsupported" || status === "subscribed") return null;
  const lead = reminderMinutes > 0 ? `${reminderMinutes} minutos antes de cada clase que apartes` : "antes de tus clases";

  return (
    <section
      className={cn("rounded-3xl border p-5", highlight ? "border-olive/40 bg-accent" : "border-border bg-card")}
      aria-labelledby="push-title"
    >
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ink text-cream">
          <BellRing className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="push-title" className="display text-2xl">
            {status === "denied" ? "Notificaciones bloqueadas" : "Activa las notificaciones"}
          </h2>
          {status === "default" && (
            <>
              <p className="mt-1 text-sm text-foreground/75">Te avisaremos {lead} y te mandaremos los avisos importantes del día del festival.</p>
              <Button onClick={enable} disabled={busy} className="mt-4 rounded-full">
                {busy ? <Loader2 className="animate-spin" /> : <BellRing />} Activar notificaciones
              </Button>
            </>
          )}
          {status === "ios-install" && (
            <>
              <p className="mt-1 text-sm text-foreground/75">En iPhone, para recibir avisos antes de tus clases primero agrega el portal a tu pantalla de inicio:</p>
              <IosSteps />
            </>
          )}
          {status === "denied" && (
            <p className="mt-1 text-sm text-foreground/75">
              Para recibir los recordatorios de tus clases, permite las notificaciones de este sitio en la configuración de tu navegador y vuelve a cargar la página.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** Control permanente en Perfil: activar/desactivar en este dispositivo y enviar una prueba. */
export function NotificationsSettings() {
  const { status, busy, enable, disable, test } = usePush();
  const subscribed = status === "subscribed";
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold">Notificaciones en este dispositivo</h2>
          <p className="text-sm text-muted-foreground">
            {status === "loading" && "Revisando…"}
            {status === "subscribed" && "Activadas: recibirás recordatorios de tus clases y avisos del festival."}
            {status === "default" && "Desactivadas."}
            {status === "denied" && "Bloqueadas en la configuración del navegador."}
            {status === "ios-install" && "En iPhone primero agrega el portal a tu pantalla de inicio."}
            {status === "unavailable" && "Las notificaciones del festival estarán disponibles muy pronto."}
            {status === "unsupported" && "Este navegador no admite notificaciones."}
          </p>
        </div>
        {(status === "default" || status === "subscribed") && (
          <Switch checked={subscribed} disabled={busy} onCheckedChange={(on) => (on ? enable() : disable())} aria-label="Notificaciones" />
        )}
      </div>
      {status === "ios-install" && <IosSteps />}
      {subscribed && (
        <Button variant="outline" size="sm" onClick={test} disabled={busy} className="mt-4 rounded-full">
          {busy ? <Loader2 className="animate-spin" /> : <BellRing />} Enviar notificación de prueba
        </Button>
      )}
    </section>
  );
}
