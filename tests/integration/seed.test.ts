import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createTestDb } from "../helpers/db";

describe("datos de demostración", () => {
  it("el seed se aplica, es idempotente y produce disponibilidad", async () => {
    const db = await createTestDb();
    const sql = readFileSync("supabase/seed.sql", "utf8");
    await db.pg.exec(sql);
    await db.pg.exec(sql);
    const ev = await db.pg.query<{ id: string; is_demo: boolean }>(`select id, (settings->>'is_demo')::boolean is_demo from events`);
    expect(ev.rows).toHaveLength(1);
    expect(ev.rows[0].is_demo).toBe(true);
    const avail = await db.rpc.call<{ available: number }[]>("get_ticket_availability", { p_event_id: ev.rows[0].id });
    expect(avail.length).toBe(4);
  });
});
