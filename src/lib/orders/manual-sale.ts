import type { RpcClient } from "@/lib/db/rpc";

export type ManualSaleMode = "paid" | "pending" | "complimentary";
export type SaleSource = "punto_fisico" | "mensaje";

export type ManualSaleRequest = {
  eventId: string;
  staffId: string;
  ticketTypeId: string;
  quantity: number;
  buyerEmail: string;
  buyerName: string;
  buyerPhone?: string;
  attendees: { name: string; email?: string }[];
  mode: ManualSaleMode;
  paymentMethod?: "cash" | "card_terminal" | "transfer";
  notes?: string;
  /** Cómo se compró: en un punto físico o por mensaje. */
  saleSource?: SaleSource;
  /** Si la pulsera se entregó en el momento de la venta. */
  wristbandDelivered?: boolean;
};

export type ManualSaleResult = {
  order_id: string;
  reference: string;
  status: "paid" | "awaiting_payment";
  tickets_issued: number;
  total_cents: number;
};

/**
 * Venta física o cortesía. Comparte el mismo control de inventario que la venta
 * en línea (bloqueo del evento + cálculo de disponibilidad en SQL).
 *  - paid: pago recibido en taquilla -> boletos válidos.
 *  - pending: pago por confirmar (p. ej. transferencia) -> boletos en `pending_payment`
 *    que NO permiten acceso hasta confirmar el pago.
 *  - complimentary: requiere permiso `issue_complimentary` y motivo; queda auditada.
 */
export function createManualSale(rpc: RpcClient, req: ManualSaleRequest) {
  return rpc.call<ManualSaleResult>("create_manual_sale", {
    p_event_id: req.eventId,
    p_staff_id: req.staffId,
    p_ticket_type_id: req.ticketTypeId,
    p_quantity: req.quantity,
    p_buyer_email: req.buyerEmail,
    p_buyer_name: req.buyerName,
    p_buyer_phone: req.buyerPhone ?? null,
    p_attendees: req.attendees,
    p_payment_method: req.mode === "complimentary" ? "complimentary" : (req.paymentMethod ?? null),
    p_payment_confirmed: req.mode !== "pending",
    p_complimentary: req.mode === "complimentary",
    p_notes: req.notes ?? null,
    p_sale_source: req.saleSource ?? null,
    p_wristband_delivered: req.wristbandDelivered ?? false,
  });
}

export function confirmManualPayment(rpc: RpcClient, orderId: string, staffId: string) {
  return rpc.call<{ updated: boolean; tickets_validated?: number }>("confirm_manual_payment", {
    p_order_id: orderId,
    p_staff_id: staffId,
  });
}
