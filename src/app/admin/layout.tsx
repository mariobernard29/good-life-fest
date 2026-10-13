import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/auth/session";
import { getStaffContext } from "@/lib/auth/staff";
import { ROLE_LABELS } from "@/lib/auth/permissions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  const ctx = await getStaffContext();
  if (!ctx) redirect("/acceso-denegado");

  return (
    <AdminShell
      permissions={[...ctx.permissions]}
      eventName={ctx.event.name}
      userEmail={ctx.user.email}
      roleLabel={ROLE_LABELS[ctx.roles[0]]}
    >
      {children}
    </AdminShell>
  );
}
