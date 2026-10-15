import type { RpcClient } from "@/lib/db/rpc";

export type WristbandResult = { changed: boolean; wristband_delivered_at: string | null };

/**
 * Marca la pulsera de un boleto como entregada (`delivered = true`) o la regresa
 * a pendiente. Queda auditado con el miembro del personal que lo hizo.
 */
export function setWristbandStatus(
  rpc: RpcClient,
  input: { ticketId: string; staffId: string; delivered: boolean },
) {
  return rpc.call<WristbandResult>("set_wristband_status", {
    p_ticket_id: input.ticketId,
    p_staff_id: input.staffId,
    p_delivered: input.delivered,
  });
}
