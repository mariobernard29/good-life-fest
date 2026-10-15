import type { Metadata } from "next";
import { SessionsAdmin } from "@/components/admin/sessions-admin";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Conferencias" };

export default async function ConferencesAdminPage({ searchParams }: PageProps<"/admin/conferencias">) {
  const ctx = await requireStaffPage("sessions.manage", "/admin/conferencias");
  return <SessionsAdmin kind="conference" event={ctx.event} sp={await searchParams} canExport={hasPermission(ctx.permissions, "exports.download")} />;
}
