import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { AdminHeader, Panel, Pill, TableWrap } from "@/components/admin/ui";
import { ActionForm, CheckboxField, Field, TextareaField } from "@/components/forms/fields";
import { DeleteContentButton } from "@/components/admin/row-actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveExhibitorAction, saveSponsorAction } from "@/app/admin/_actions/catalog";
import type { EventRow, ExhibitorRow, SponsorRow } from "@/lib/types";

/** Administración de patrocinadores y expositores (misma estructura). */
export async function ContentAdmin({ kind, event, sp }: { kind: "sponsor" | "exhibitor"; event: EventRow; sp: Record<string, string | string[] | undefined> }) {
  const isSponsor = kind === "sponsor";
  const base = isSponsor ? "/admin/patrocinadores" : "/admin/expositores";
  const { data } = await createAdminClient().from(isSponsor ? "sponsors" : "exhibitors").select("*").eq("event_id", event.id).order("sort_order");
  const rows = (data ?? []) as (SponsorRow & ExhibitorRow)[];
  const editing = typeof sp.editar === "string" ? rows.find((r) => r.id === sp.editar) : undefined;
  const showForm = Boolean(editing) || sp.nuevo === "1";

  return (
    <>
      <AdminHeader
        title={isSponsor ? "Patrocinadores" : "Expositores"}
        description="Solo los registros publicados aparecen en el sitio."
        actions={
          <Button asChild className="rounded-full">
            <Link href={`${base}?nuevo=1`}>
              <Plus /> Agregar
            </Link>
          </Button>
        }
      />
      {sp.guardado === "1" && <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">Cambios guardados.</p>}
      {showForm && (
        <Panel title={editing ? `Editar: ${editing.name}` : "Nuevo registro"} className="mb-6">
          <ActionForm action={isSponsor ? saveSponsorAction : saveExhibitorAction} submitLabel="Guardar" resetKey={editing?.id ?? "new"}>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nombre" name="name" defaultValue={editing?.name} required />
              {isSponsor ? (
                <Field label="Nivel" name="tier" defaultValue={editing?.tier ?? "aliado"} required hint="Ej. presenta, oro, aliado" />
              ) : (
                <Field label="Categoría" name="category" defaultValue={editing?.category ?? "bienestar"} required />
              )}
              {!isSponsor && <Field label="Stand" name="booth" defaultValue={editing?.booth ?? ""} />}
              <Field label="Logo (URL https)" name="logoUrl" defaultValue={editing?.logo_url ?? ""} />
              <Field label="Sitio web (URL https)" name="websiteUrl" defaultValue={editing?.website_url ?? ""} />
              <Field label="Orden" name="sortOrder" type="number" min={0} defaultValue={editing?.sort_order ?? 0} />
            </div>
            <TextareaField label="Descripción" name="description" defaultValue={editing?.description} rows={2} />
            <CheckboxField label="Publicado en el sitio" name="isPublished" defaultChecked={editing?.is_published ?? true} />
          </ActionForm>
        </Panel>
      )}
      <TableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>{isSponsor ? "Nivel" : "Categoría · stand"}</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Sin registros.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm">{isSponsor ? r.tier : `${r.category}${r.booth ? ` · ${r.booth}` : ""}`}</TableCell>
                <TableCell>
                  <Pill tone={r.is_published ? "green" : "gray"}>{r.is_published ? "Publicado" : "Oculto"}</Pill>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button asChild size="icon-sm" variant="ghost" aria-label="Editar">
                    <Link href={`${base}?editar=${r.id}`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <DeleteContentButton kind={kind} id={r.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrap>
    </>
  );
}
