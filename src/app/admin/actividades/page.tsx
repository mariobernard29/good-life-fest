import type { Metadata } from "next";
import { SessionsAdmin } from "@/components/admin/sessions-admin";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Clases y talleres" };

export default async function ActivitiesAdminPage({ searchParams }: PageProps<"/admin/actividades">) {
  const ctx = await requireStaffPage("sessions.manage", "/admin/actividades");
  return <SessionsAdmin kind="activity" event={ctx.event} sp={await searchParams} canExport={hasPermission(ctx.permissions, "exports.download")} />;
}
