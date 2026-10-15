import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { ParticipantForm } from "@/components/admin/participant-form";
import { Button } from "@/components/ui/button";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRpc } from "@/lib/db/server-rpc";
import type { TicketAvailability, TicketTypeRow } from "@/lib/types";

export const metadata: Metadata = { title: "Registrar participante" };

export default async function NewParticipantPage() {
  const ctx = await requireStaffPage("participants.register", "/admin/asistentes/nuevo");
  const [{ data: types }, availability] = await Promise.all([
    createAdminClient()
      .from("ticket_types")
      .select("*")
      .eq("event_id", ctx.event.id)
      .in("sale_status", ["on_sale", "box_office_only"])
      .order("sort_order"),
    getRpc().call<TicketAvailability[]>("get_ticket_availability", { p_event_id: ctx.event.id }),
  ]);

  return (
    <>
      <AdminHeader
        title="Registrar participante"
        description="Para quien compró en un punto físico o por mensaje. Se crea su cuenta, se emite su entrada y le llega un correo para crear su contraseña."
        actions={
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/asistentes">
              <ArrowLeft /> Asistentes
            </Link>
          </Button>
        }
      />
      <Panel className="max-w-3xl">
        <ParticipantForm
          ticketTypes={((types ?? []) as TicketTypeRow[]).map((t) => ({
            id: t.id,
            name: t.name,
            priceCents: t.price_cents,
            available: availability.find((a) => a.ticket_type_id === t.id)?.available ?? 0,
          }))}
          canComplimentary={hasPermission(ctx.permissions, "sales.complimentary")}
        />
      </Panel>
    </>
  );
}
