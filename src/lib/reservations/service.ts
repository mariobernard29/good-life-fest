import type { RpcClient } from "@/lib/db/rpc";

export type SessionKind = "activity" | "conference";

export type ReserveResult = {
  reservation_id: string;
  status: "confirmed" | "waitlisted";
  waitlist_position: number | null;
  remaining: number;
};

export type CancelResult = { cancelled: boolean; already_cancelled?: boolean; promoted: string[] };

/**
 * Reglas (implementadas en SQL con bloqueo de la fila de la sesión):
 *  - sin sobrecupo; sin duplicados por boleto; sin traslapes de horario;
 *  - el boleto debe pertenecer al usuario y estar vigente si la sesión lo exige;
 *  - sesión llena + lista de espera habilitada => queda en lista de espera (FIFO).
 */
export function reserveSession(
  rpc: RpcClient,
  input: { profileId: string; ticketId: string | null; kind: SessionKind; sessionId: string },
) {
  return rpc.call<ReserveResult>("reserve_session", {
    p_profile_id: input.profileId,
    p_ticket_id: input.ticketId,
    p_activity_id: input.kind === "activity" ? input.sessionId : null,
    p_conference_id: input.kind === "conference" ? input.sessionId : null,
  });
}

/**
 * Cancela y libera el lugar. Si hay lista de espera, el primer lugar liberado
 * se asigna automáticamente a la reserva en espera más antigua (FIFO).
 */
export function cancelReservation(
  rpc: RpcClient,
  input: { reservationId: string; actorId: string; asAdmin?: boolean },
) {
  return rpc.call<CancelResult>("cancel_reservation", {
    p_reservation_id: input.reservationId,
    p_actor_id: input.actorId,
    p_as_admin: input.asAdmin ?? false,
  });
}

export type CapacityResolution = "keep_existing" | "move_excess_to_waitlist";

export function updateSessionCapacity(
  rpc: RpcClient,
  input: { kind: SessionKind; sessionId: string; capacity: number; resolution: CapacityResolution | null; actorId: string },
) {
  return rpc.call<{ capacity: number; confirmed: number; moved_to_waitlist: number; overbooked: number }>(
    "update_session_capacity",
    {
      p_activity_id: input.kind === "activity" ? input.sessionId : null,
      p_conference_id: input.kind === "conference" ? input.sessionId : null,
      p_capacity: input.capacity,
      p_resolution: input.resolution,
      p_actor_id: input.actorId,
    },
  );
}

export function cancelSession(rpc: RpcClient, input: { kind: SessionKind; sessionId: string; actorId: string }) {
  return rpc.call<{ reservations_cancelled: number }>("cancel_session", {
    p_activity_id: input.kind === "activity" ? input.sessionId : null,
    p_conference_id: input.kind === "conference" ? input.sessionId : null,
    p_actor_id: input.actorId,
  });
}
