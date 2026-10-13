"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/admin/common";
import { AppError, logError, userMessage, type ActionResult } from "@/lib/errors";
import { exhibitorSchema, fieldErrors, formDataToObject, sponsorSchema, ticketTypeSchema } from "@/lib/validation/schemas";
import { zonedLocalToUtc } from "@/lib/format";
import type { AdminFormState } from "./form-state";

const list = (s: string) =>
  s
    .split(/\r?\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);

// --- Tipos de entrada ----------------------------------------------------------
export async function saveTicketTypeAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const parsed = ticketTypeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  try {
    const ctx = await requireStaff("ticket_types.manage");
    const d = parsed.data;
    const tz = ctx.event.timezone;
    const row = {
      name: d.name,
      description: d.description,
      price_cents: Math.round(d.priceMxn * 100),
      quantity_total: d.quantityTotal,
      max_per_order: d.maxPerOrder,
      benefits: list(d.benefits),
      access_areas: list(d.accessAreas).map((a) => a.toLowerCase()).length ? list(d.accessAreas).map((a) => a.toLowerCase()) : ["general"],
      sale_status: d.saleStatus,
      sales_start_at: d.salesStartAt ? zonedLocalToUtc(d.salesStartAt, tz) : null,
      sales_end_at: d.salesEndAt ? zonedLocalToUtc(d.salesEndAt, tz) : null,
      sort_order: d.sortOrder,
    };
    const admin = createAdminClient();

    if (d.id) {
      // No se permite reducir el inventario por debajo de lo ya emitido o apartado.
      const { data: avail } = await admin.rpc("get_ticket_availability", { p_event_id: ctx.event.id });
      const a = (avail as { ticket_type_id: string; issued: number; held: number }[] | null)?.find((x) => x.ticket_type_id === d.id);
      if (a && row.quantity_total < a.issued + a.held) {
        return { fieldErrors: { quantityTotal: [`Ya hay ${a.issued} emitidas y ${a.held} apartadas; el inventario no puede ser menor a ${a.issued + a.held}.`] } };
      }
      const { data: before } = await admin.from("ticket_types").select("price_cents, quantity_total, sale_status").eq("id", d.id).eq("event_id", ctx.event.id).maybeSingle();
      if (!before) throw new AppError("TICKET_TYPE_NOT_FOUND");
      const { error } = await admin.from("ticket_types").update(row).eq("id", d.id).eq("event_id", ctx.event.id);
      if (error) throw new AppError("UNKNOWN", error.message);
      await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "ticket_type.updated", entity: "ticket_type", entityId: d.id, details: { before, after: { price_cents: row.price_cents, quantity_total: row.quantity_total, sale_status: row.sale_status } } });
    } else {
      const { data, error } = await admin.from("ticket_types").insert({ ...row, event_id: ctx.event.id }).select("id").single();
      if (error) throw new AppError("UNKNOWN", error.code === "23505" ? "duplicate" : error.message);
      await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: "ticket_type.created", entity: "ticket_type", entityId: data.id, details: { price_cents: row.price_cents, quantity_total: row.quantity_total } });
    }
  } catch (error) {
    logError("saveTicketTypeAction", error);
    if (error instanceof AppError && error.detail === "duplicate") return { error: "Ya existe un tipo de entrada con ese nombre." };
    return { error: userMessage(error) };
  }
  revalidatePath("/admin/entradas");
  revalidatePath("/entradas");
  redirect("/admin/entradas?guardado=1");
}

// --- Patrocinadores y expositores ---------------------------------------------
type ContentKind = "sponsor" | "exhibitor";
const CONTENT = {
  sponsor: { table: "sponsors", path: "/admin/patrocinadores", schema: sponsorSchema },
  exhibitor: { table: "exhibitors", path: "/admin/expositores", schema: exhibitorSchema },
} as const;

async function saveContent(kind: ContentKind, formData: FormData): Promise<AdminFormState> {
  const cfg = CONTENT[kind];
  const parsed = cfg.schema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), error: "Revisa los campos marcados." };
  try {
    const ctx = await requireStaff("content.manage");
    const d = parsed.data as Record<string, unknown>;
    const row: Record<string, unknown> = {
      name: d.name,
      description: d.description,
      logo_url: d.logoUrl || null,
      website_url: d.websiteUrl || null,
      sort_order: d.sortOrder,
      is_published: d.isPublished,
    };
    if (kind === "sponsor") row.tier = d.tier;
    else {
      row.category = d.category;
      row.booth = d.booth || null;
    }
    const admin = createAdminClient();
    const res = d.id
      ? await admin.from(cfg.table).update(row).eq("id", d.id as string).eq("event_id", ctx.event.id)
      : await admin.from(cfg.table).insert({ ...row, event_id: ctx.event.id });
    if (res.error) throw new AppError("UNKNOWN", res.error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: `${kind}.${d.id ? "updated" : "created"}`, entity: kind, entityId: (d.id as string) ?? null });
  } catch (error) {
    logError("saveContent", error);
    return { error: userMessage(error) };
  }
  revalidatePath(cfg.path);
  revalidatePath("/expositores");
  redirect(`${cfg.path}?guardado=1`);
}

export async function saveSponsorAction(_prev: AdminFormState, formData: FormData) {
  return saveContent("sponsor", formData);
}
export async function saveExhibitorAction(_prev: AdminFormState, formData: FormData) {
  return saveContent("exhibitor", formData);
}

export async function deleteContentAction(kind: ContentKind, id: string): Promise<ActionResult<null>> {
  try {
    const ctx = await requireStaff("content.manage");
    const cfg = CONTENT[kind];
    const { error } = await createAdminClient().from(cfg.table).delete().eq("id", id).eq("event_id", ctx.event.id);
    if (error) throw new AppError("UNKNOWN", error.message);
    await audit({ actorId: ctx.user.id, eventId: ctx.event.id, action: `${kind}.deleted`, entity: kind, entityId: id });
    revalidatePath(cfg.path);
    revalidatePath("/expositores");
    return { ok: true, data: null, message: "Eliminado." };
  } catch (error) {
    logError("deleteContentAction", error);
    return { ok: false, error: userMessage(error) };
  }
}
