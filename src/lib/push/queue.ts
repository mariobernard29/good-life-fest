import type { RpcClient } from "@/lib/db/rpc";

export type DueReminder = {
  reservation_id: string;
  profile_id: string;
  kind: "activity" | "conference";
  name: string;
  starts_at: string;
  location: string;
};

export type NotificationAudience = "all" | "activity" | "conference";

export type DueNotification = {
  id: string;
  title: string;
  body: string;
  url: string | null;
  audience: NotificationAudience;
  activity_id: string | null;
  conference_id: string | null;
  send_at: string;
};

export type PushTarget = { id: string; profile_id: string; endpoint: string; p256dh: string; auth: string };

/**
 * Toma las reservas confirmadas cuya sesión empieza dentro de `leadMinutes` y las
 * marca como recordadas en la misma operación: cada reserva sale una sola vez.
 */
export function claimDueReminders(rpc: RpcClient, eventId: string, leadMinutes: number) {
  return rpc.call<DueReminder[]>("claim_due_reminders", { p_event_id: eventId, p_lead_minutes: leadMinutes });
}

/** Reserva que salió de la lista de espera (misma forma que un recordatorio). */
export type PromotedReservation = DueReminder;

/**
 * Toma las reservas promovidas de la lista de espera que aún no se avisan y las
 * marca en la misma operación: cada promoción sale una sola vez. Con
 * `reservationIds` se limita a esas reservas (envío inmediato tras liberar un lugar).
 */
export function claimPromotedReservations(rpc: RpcClient, eventId: string, reservationIds?: string[]) {
  return rpc.call<PromotedReservation[]>("claim_promoted_reservations", {
    p_event_id: eventId,
    p_reservation_ids: reservationIds ?? null,
  });
}

/** Toma los avisos programados que ya deben salir (quedan en estado `sending`). */
export function claimDueNotifications(rpc: RpcClient, eventId: string) {
  return rpc.call<DueNotification[]>("claim_due_notifications", { p_event_id: eventId });
}

/** Suscripciones push que deben recibir un aviso según su audiencia. */
export function notificationRecipients(rpc: RpcClient, notificationId: string) {
  return rpc.call<PushTarget[]>("notification_recipients", { p_notification_id: notificationId });
}
