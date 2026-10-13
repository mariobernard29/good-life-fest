import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { RpcClient } from "@/lib/db/rpc";
import { toAppError } from "@/lib/db/rpc";

/**
 * Base de datos PostgreSQL real (PGlite, WASM) con un "stub" mínimo de lo que
 * Supabase provee: roles anon/authenticated/service_role, esquema auth, auth.uid().
 * Se aplican las MISMAS migraciones que en producción.
 */
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    email_confirmed_at timestamptz,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    raw_app_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
`;

const MIGRATIONS_DIR = path.join(process.cwd(), "supabase", "migrations");

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

export async function createTestDb() {
  const pg = new PGlite();
  await pg.exec(SUPABASE_STUB);
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    await pg.exec(readFileSync(path.join(MIGRATIONS_DIR, file), "utf8"));
  }

  /** Cliente RPC equivalente al del servidor (service_role). */
  const rpc: RpcClient = {
    async call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
      const names = Object.keys(args);
      const params = names.map((n, i) => `${n} => $${i + 1}`).join(", ");
      const values = names.map((n) => {
        const v = args[n];
        return v !== null && typeof v === "object" ? JSON.stringify(v) : v;
      });
      try {
        const res = await pg.query<{ result: T }>(`select public.${fn}(${params}) as result`, values);
        return res.rows[0]?.result as T;
      } catch (error) {
        throw toAppError(error);
      }
    },
  };

  async function createUser(email: string, opts: { confirmed?: boolean; fullName?: string } = {}) {
    const res = await pg.query<{ id: string }>(
      `insert into auth.users (email, email_confirmed_at, raw_user_meta_data)
       values ($1, $2, $3) returning id`,
      [email, opts.confirmed === false ? null : new Date().toISOString(), JSON.stringify({ full_name: opts.fullName ?? email })],
    );
    return res.rows[0].id;
  }

  async function createStaff(email: string, role: string, eventId: string | null, permissions: string[] = []) {
    const id = await createUser(email);
    await pg.query(
      `insert into public.event_staff (user_id, event_id, role, permissions) values ($1, $2, $3, $4)`,
      [id, role === "super_admin" ? null : eventId, role, permissions],
    );
    return id;
  }

  /** Ejecuta una consulta como un usuario autenticado (RLS activo). */
  async function asUser<T>(userId: string, sql: string, params: unknown[] = []) {
    await pg.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`);
    try {
      return (await pg.query<T>(sql, params)).rows;
    } finally {
      await pg.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
    }
  }

  async function seedEvent(opts: { capacity?: number; ticketQty?: number; price?: number; maxPerOrder?: number } = {}) {
    const ev = await pg.query<{ id: string }>(
      `insert into public.events (name, slug, starts_at, ends_at, max_capacity, status)
       values ('Festival de prueba', 'festival-prueba-' || substr(md5(random()::text), 1, 6),
               now() + interval '30 days', now() + interval '31 days', $1, 'published') returning id`,
      [opts.capacity ?? 1000],
    );
    const eventId = ev.rows[0].id;
    const tt = await pg.query<{ id: string }>(
      `insert into public.ticket_types (event_id, name, price_cents, quantity_total, max_per_order, sale_status)
       values ($1, 'General', $2, $3, $4, 'on_sale') returning id`,
      [eventId, opts.price ?? 150000, opts.ticketQty ?? 100, opts.maxPerOrder ?? 6],
    );
    return { eventId, ticketTypeId: tt.rows[0].id };
  }

  async function seedActivity(eventId: string, opts: { capacity?: number; waitlist?: boolean; startsInHours?: number } = {}) {
    const res = await pg.query<{ id: string }>(
      `insert into public.activities (event_id, name, starts_at, ends_at, capacity, status, waitlist_enabled)
       values ($1, 'Yoga al amanecer', now() + make_interval(hours => $2::int), now() + make_interval(hours => $2::int + 1), $3, 'published', $4)
       returning id`,
      [eventId, opts.startsInHours ?? 48, opts.capacity ?? 10, opts.waitlist ?? false],
    );
    return res.rows[0].id;
  }

  return { pg, rpc, createUser, createStaff, asUser, seedEvent, seedActivity };
}
