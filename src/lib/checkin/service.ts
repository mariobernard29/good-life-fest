import type { RpcClient } from "@/lib/db/rpc";
import { parseTicketInput } from "@/lib/tickets/qr";
import type { CheckInResult } from "@/lib/types";

export type CheckInResponse = {
  result: CheckInResult;
  ticket?: {
    id: string;
    public_code: string;
    attendee_name: string;
    ticket_type: string;
    status: string;
    checked_in_at: string | null;
  };
};

export { CHECK_IN_LABELS } from "@/lib/checkin/labels";

/**
 * Valida un boleto en el servidor. La transición valid -> checked_in es un UPDATE
 * condicional en PostgreSQL: si dos dispositivos escanean a la vez, solo uno gana.
 */
export async function checkInTicket(
  rpc: RpcClient,
  input: { eventId: string; staffId: string; raw: string; accessArea: string; method: "scan" | "manual" },
): Promise<CheckInResponse> {
  const parsed = parseTicketInput(input.raw);
  if (!parsed) return { result: "invalid" };
  return rpc.call<CheckInResponse>("check_in_ticket", {
    p_event_id: input.eventId,
    p_staff_id: input.staffId,
    p_qr_token: parsed.kind === "token" ? parsed.token : null,
    p_public_code: parsed.kind === "code" ? parsed.code : null,
    p_access_area: input.accessArea,
    p_method: input.method,
  });
}
