import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { AdminHeader, FilterSelect, Pagination, Pill, StatTile, TableWrap } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAGE_SIZE, pageRange, parsePage, str } from "@/lib/admin/common";
import { CHECK_IN_LABELS } from "@/lib/checkin/service";
import { formatDateTime } from "@/lib/format";
import type { CheckInResult } from "@/lib/types";

export const metadata: Metadata = { title: "Accesos" };

export default async function AccessLogPage({ searchParams }: PageProps<"/admin/accesos">) {
  const ctx = await requireStaffPage("checkin.view_log", "/admin/accesos");
  const sp = await searchParams;
  const page = parsePage(sp.pagina);
  const result = str(sp.resultado);
  const admin = createAdminClient();

  let query = admin
    .from("check_ins")
    .select("id, result, access_area, method, created_at, tickets(public_code, attendee_name, ticket_types(name)), profiles(full_name, email)", { count: "exact" })
    .eq("event_id", ctx.event.id)
    .order("created_at", { ascending: false })
    .range(...pageRange(page));
  if (result) query = query.eq("result", result);

  const counts = await Promise.all(
    (["accepted", "already_used", "invalid"] as const).map(async (r) => {
      const { count } = await admin.from("check_ins").select("id", { count: "exact", head: true }).eq("event_id", ctx.event.id).eq("result", r);
      return count ?? 0;
    }),
  );
  const [{ data, count }, { count: inside }] = await Promise.all([
    query,
    admin.from("tickets").select("id", { count: "exact", head: true }).eq("event_id", ctx.event.id).eq("status", "checked_in"),
  ]);

  return (
    <>
      <AdminHeader
        title="Control de accesos"
        description="Registro de cada validación, autorizada o rechazada."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/check-in">
              <ScanLine /> Abrir escáner
            </Link>
          </Button>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Personas dentro (check-in)" value={inside ?? 0} />
        <StatTile label="Accesos autorizados" value={counts[0]} />
        <StatTile label="Intentos con boleto usado" value={counts[1]} tone={counts[1] ? "warning" : undefined} />
        <StatTile label="Boletos inválidos" value={counts[2]} tone={counts[2] ? "danger" : undefined} />
      </div>
      <form className="mb-4 flex gap-2">
        <FilterSelect name="resultado" label="Resultado" value={result} options={Object.entries(CHECK_IN_LABELS).map(([value, v]) => ({ value, label: v.title }))} />
        <Button type="submit" variant="outline" className="h-10">
          Filtrar
        </Button>
      </form>
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y hora</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Boleto</TableHead>
              <TableHead>Acceso / método</TableHead>
              <TableHead>Personal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Sin registros.
                </TableCell>
              </TableRow>
            )}
            {(data ?? []).map((c) => {
              const label = CHECK_IN_LABELS[c.result as CheckInResult];
              const t = c.tickets as unknown as { public_code: string; attendee_name: string; ticket_types: { name: string } | null } | null;
              const s = c.profiles as unknown as { full_name: string; email: string } | null;
              return (
                <TableRow key={c.id}>
                  <TableCell className="text-xs">{formatDateTime(c.created_at)}</TableCell>
                  <TableCell>
                    <Pill tone={label.tone === "success" ? "green" : label.tone === "warning" ? "amber" : "red"}>{label.title}</Pill>
                  </TableCell>
                  <TableCell className="text-sm">
                    {t ? (
                      <>
                        {t.attendee_name} <span className="font-mono text-xs text-muted-foreground">{t.public_code}</span>
                        <p className="text-xs text-muted-foreground">{t.ticket_types?.name}</p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No identificado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.access_area} · {c.method === "scan" ? "Escaneo" : "Manual"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s?.full_name || s?.email}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableWrap>
      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} params={{ resultado: result }} />
    </>
  );
}
