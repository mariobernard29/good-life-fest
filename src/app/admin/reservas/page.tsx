import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, FilterSelect, Pagination, Pill, TableWrap } from "@/components/admin/ui";
import { AdminCancelReservationButton } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, pageRange, parsePage, str } from "@/lib/admin/common";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Reservas" };

export default async function ReservationsAdminPage({ searchParams }: PageProps<"/admin/reservas">) {
  const ctx = await requireStaffPage("reservations.manage", "/admin/reservas");
  const sp = await searchParams;
  const page = parsePage(sp.pagina);
  const activityId = str(sp.actividad);
  const conferenceId = str(sp.conferencia);
  const status = str(sp.estado);
  const admin = createAdminClient();

  let query = admin
    .from("reservations")
    .select("id, status, reserved_at, promoted_at, cancelled_at, profiles!reservations_profile_id_fkey(full_name, email), tickets(public_code, attendee_name), activities(name, starts_at), conferences(title, starts_at)", { count: "exact" })
    .eq("event_id", ctx.event.id)
    .order("reserved_at", { ascending: true })
    .range(...pageRange(page));
  if (activityId) query = query.eq("activity_id", activityId);
  if (conferenceId) query = query.eq("conference_id", conferenceId);
  if (status) query = query.eq("status", status);
  const [{ data, count, error }, { data: acts }, { data: confs }] = await Promise.all([
    query,
    admin.from("activities").select("id, name").eq("event_id", ctx.event.id).order("starts_at"),
    admin.from("conferences").select("id, title").eq("event_id", ctx.event.id).eq("requires_reservation", true).order("starts_at"),
  ]);
  if (error) console.error("[reservas]", error.message);

  return (
    <>
      <AdminHeader title="Reservas" description="Orden de llegada: la lista de espera se atiende FIFO al liberarse un lugar." />
      <form className="mb-4 flex flex-wrap gap-2">
        <FilterSelect name="actividad" label="Clase" value={activityId} options={(acts ?? []).map((a) => ({ value: a.id, label: a.name }))} />
        <FilterSelect name="conferencia" label="Conferencia" value={conferenceId} options={(confs ?? []).map((c) => ({ value: c.id, label: c.title }))} />
        <FilterSelect name="estado" label="Estado" value={status} options={[{ value: "confirmed", label: "Confirmada" }, { value: "waitlisted", label: "Lista de espera" }, { value: "cancelled", label: "Cancelada" }]} />
        <Button type="submit" variant="outline" className="h-10">
          Filtrar
        </Button>
      </form>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asistente</TableHead>
              <TableHead>Sesión</TableHead>
              <TableHead>Reservó</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Sin reservas.
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).map((r) => {
              const p = r.profiles as unknown as { full_name: string; email: string } | null;
              const t = r.tickets as unknown as { public_code: string; attendee_name: string } | null;
              const a = r.activities as unknown as { name: string; starts_at: string } | null;
              const c = r.conferences as unknown as { title: string; starts_at: string } | null;
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{t?.attendee_name || p?.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {p?.email} {t && <span className="font-mono">· {t.public_code}</span>}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {a?.name ?? c?.title}
                    <p className="text-xs text-muted-foreground">{formatDateTime((a ?? c)!.starts_at)}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(r.reserved_at)}
                    {r.promoted_at && <p>Promovida {formatDateTime(r.promoted_at)}</p>}
                  </TableCell>
                  <TableCell>
                    <Pill tone={r.status === "confirmed" ? "green" : r.status === "waitlisted" ? "amber" : "gray"}>
                      {r.status === "confirmed" ? "Confirmada" : r.status === "waitlisted" ? "En espera" : "Cancelada"}
                    </Pill>
                  </TableCell>
                  <TableCell className="text-right">{r.status !== "cancelled" && <AdminCancelReservationButton reservationId={r.id} />}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} params={{ actividad: activityId, conferencia: conferenceId, estado: status }} />
      <p className="mt-6 text-xs text-muted-foreground">
        ¿Necesitas mover a alguien entre sesiones? Registra una{" "}
        <Link href="/admin/incidencias" className="text-olive underline">
          incidencia de cambio de reserva
        </Link>
        : las excepciones nunca superan el cupo automáticamente.
      </p>
    </>
  );
}
