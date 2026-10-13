import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { likePattern, pageRange } from "@/lib/admin/common";

export type AttendeeRow = {
  id: string;
  public_code: string;
  attendee_name: string;
  attendee_email: string | null;
  status: string;
  checked_in_at: string | null;
  issued_at: string;
  ticket_types: { name: string } | null;
  profiles: { email: string; full_name: string } | null;
  order_items: { orders: { reference: string; buyer_email: string; buyer_name: string; status: string; channel: string } | null } | null;
};

const SELECT =
  "id, public_code, attendee_name, attendee_email, status, checked_in_at, issued_at, ticket_types(name), profiles(email, full_name), order_items!inner(orders!inner(reference, buyer_email, buyer_name, status, channel))";

/**
 * Búsqueda paginada de boletos/asistentes por nombre, correo (asistente, cuenta
 * o comprador), código de boleto o referencia de pedido.
 */
export async function searchAttendees(
  eventId: string,
  opts: { q?: string; ticketTypeId?: string; status?: string; payment?: string; checkin?: string; page: number },
) {
  const admin = createAdminClient();
  let query = admin
    .from("tickets")
    .select(SELECT, { count: "exact" })
    .eq("event_id", eventId)
    .order("issued_at", { ascending: false })
    .range(...pageRange(opts.page));

  if (opts.ticketTypeId) query = query.eq("ticket_type_id", opts.ticketTypeId);
  if (opts.status) query = query.eq("status", opts.status);
  if (opts.checkin === "si") query = query.not("checked_in_at", "is", null);
  if (opts.checkin === "no") query = query.is("checked_in_at", null);
  if (opts.payment) query = query.eq("order_items.orders.status", opts.payment);

  const q = opts.q?.trim();
  if (q) {
    if (/^GL-[A-F0-9]{5}-[A-F0-9]{5}$/i.test(q)) {
      query = query.eq("public_code", q.toUpperCase());
    } else if (/^GLF-/i.test(q)) {
      query = query.ilike("order_items.orders.reference", likePattern(q.toUpperCase()));
    } else {
      const pattern = likePattern(q);
      // Pedidos cuyo comprador coincide + perfiles cuyo correo/nombre coincide.
      const [{ data: orders }, { data: profiles }] = await Promise.all([
        admin.from("orders").select("id").eq("event_id", eventId).or(`buyer_email.ilike.${pattern},buyer_name.ilike.${pattern}`).limit(200),
        admin.from("profiles").select("id").or(`email.ilike.${pattern},full_name.ilike.${pattern}`).limit(200),
      ]);
      const orderIds = (orders ?? []).map((o) => o.id);
      const itemIds = orderIds.length
        ? ((await admin.from("order_items").select("id").in("order_id", orderIds)).data ?? []).map((i) => i.id)
        : [];
      const ors = [`attendee_name.ilike.${pattern}`, `attendee_email.ilike.${pattern}`, `public_code.ilike.${pattern}`];
      if (itemIds.length) ors.push(`order_item_id.in.(${itemIds.join(",")})`);
      const profileIds = (profiles ?? []).map((p) => p.id);
      if (profileIds.length) ors.push(`owner_profile_id.in.(${profileIds.join(",")})`);
      query = query.or(ors.join(","));
    }
  }

  const { data, count, error } = await query;
  if (error) console.error("[searchAttendees]", error.message);
  return { rows: (data ?? []) as unknown as AttendeeRow[], total: count ?? 0 };
}
