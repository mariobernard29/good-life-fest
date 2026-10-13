/**
 * Pruebas de concurrencia REAL contra un proyecto Supabase de desarrollo.
 * PGlite (pruebas de integración) ejecuta una sola conexión; aquí cada llamada RPC
 * es una solicitud HTTP independiente que PostgREST atiende con conexiones
 * distintas del pool, por lo que los bloqueos FOR UPDATE se ejercitan de verdad.
 *
 * Opt-in:  RUN_REMOTE_TESTS=1 npm run test:remote
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY (.env.local).
 * Crea un evento temporal y usuarios de prueba y los elimina al terminar.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toAppError, type RpcClient } from "@/lib/db/rpc";
import { reserveSession } from "@/lib/reservations/service";
import { checkInTicket } from "@/lib/checkin/service";
import { createManualSale } from "@/lib/orders/manual-sale";

const enabled = process.env.RUN_REMOTE_TESTS === "1";
const PARALLEL = 12;

describe.runIf(enabled)("Concurrencia real en Supabase", () => {
  let admin: SupabaseClient;
  let rpc: RpcClient;
  let eventId: string;
  let ticketTypeId: string;
  const userIds: string[] = [];

  async function createUser(email: string) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: true });
    if (error) throw error;
    userIds.push(data.user.id);
    return data.user.id;
  }

  beforeAll(async () => {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    rpc = {
      async call<T>(fn: string, args: Record<string, unknown>) {
        const { data, error } = await admin.rpc(fn, args);
        if (error) throw toAppError(error);
        return data as T;
      },
    };
    const slug = `prueba-concurrencia-${Date.now()}`;
    const ev = await admin
      .from("events")
      .insert({
        name: "Prueba de concurrencia", slug, max_capacity: 1000, status: "published",
        starts_at: new Date(Date.now() + 30 * 864e5).toISOString(), ends_at: new Date(Date.now() + 31 * 864e5).toISOString(),
        settings: { is_test: true },
      })
      .select("id")
      .single();
    if (ev.error) throw ev.error;
    eventId = ev.data.id;
    const tt = await admin
      .from("ticket_types")
      .insert({ event_id: eventId, name: "General", price_cents: 50000, quantity_total: 1, max_per_order: 1, sale_status: "on_sale" })
      .select("id")
      .single();
    if (tt.error) throw tt.error;
    ticketTypeId = tt.data.id;
  }, 60_000);

  afterAll(async () => {
    if (!admin || !eventId) return;
    await admin.from("tickets").delete().eq("event_id", eventId);
    await admin.from("orders").delete().eq("event_id", eventId);
    await admin.from("audit_logs").delete().eq("event_id", eventId);
    await admin.from("events").delete().eq("id", eventId);
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
  }, 60_000);

  it(`${PARALLEL} compras simultáneas de la última entrada: exactamente una retención`, async () => {
    const results = await Promise.allSettled(
      Array.from({ length: PARALLEL }, (_, i) =>
        rpc.call("create_order_hold", {
          p_event_id: eventId,
          p_items: [{ ticket_type_id: ticketTypeId, quantity: 1 }],
          p_buyer_email: `paralelo${i}@correo.mx`,
          p_buyer_name: `P${i}`,
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const reasons = results.filter((r) => r.status === "rejected").map((r) => (r as PromiseRejectedResult).reason.code);
    expect(new Set(reasons)).toEqual(new Set(["INSUFFICIENT_INVENTORY"]));
  }, 60_000);

  it(`${PARALLEL} reservas simultáneas por 1 cupo y doble escaneo simultáneo`, async () => {
    await admin.from("ticket_types").update({ quantity_total: 100, max_per_order: 10 }).eq("id", ticketTypeId);
    const seller = await createUser(`taquilla-${Date.now()}@prueba.glf`);
    await admin.from("event_staff").insert({ user_id: seller, event_id: eventId, role: "event_admin" });

    const people: { userId: string; ticketId: string }[] = [];
    for (let i = 0; i < PARALLEL; i++) {
      const email = `asistente${i}-${Date.now()}@prueba.glf`;
      const userId = await createUser(email);
      await createManualSale(rpc, {
        eventId, staffId: seller, ticketTypeId, quantity: 1, buyerEmail: email, buyerName: `A${i}`,
        attendees: [], mode: "paid", paymentMethod: "cash",
      });
      const t = await admin.from("tickets").select("id").eq("owner_profile_id", userId).single();
      people.push({ userId, ticketId: t.data!.id });
    }

    const act = await admin
      .from("activities")
      .insert({
        event_id: eventId, name: "Clase concurrida", capacity: 1, status: "published",
        starts_at: new Date(Date.now() + 2 * 864e5).toISOString(), ends_at: new Date(Date.now() + 2 * 864e5 + 3600e3).toISOString(),
      })
      .select("id")
      .single();
    const results = await Promise.allSettled(
      people.map((p) => reserveSession(rpc, { profileId: p.userId, ticketId: p.ticketId, kind: "activity", sessionId: act.data!.id })),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const { count } = await admin
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", act.data!.id)
      .eq("status", "confirmed");
    expect(count).toBe(1);

    const code = (await admin.from("tickets").select("public_code").eq("id", people[0].ticketId).single()).data!.public_code;
    const scans = await Promise.all(
      Array.from({ length: 6 }, () => checkInTicket(rpc, { eventId, staffId: seller, raw: code, accessArea: "general", method: "manual" })),
    );
    expect(scans.filter((s) => s.result === "accepted")).toHaveLength(1);
    expect(scans.filter((s) => s.result === "already_used")).toHaveLength(5);
  }, 180_000);
});
