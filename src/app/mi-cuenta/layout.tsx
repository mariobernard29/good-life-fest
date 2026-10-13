import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { PortalNav } from "@/components/portal/portal-nav";
import { requireUserPage } from "@/lib/auth/session";
import { getStaffContext } from "@/lib/auth/staff";
import { getRpc } from "@/lib/db/server-rpc";
import { signOutAction } from "@/app/(auth)/actions";
import { staffHome } from "@/lib/auth/permissions";
import { logError } from "@/lib/errors";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/mi-cuenta");
  // Vincula compras hechas como invitado con el correo verificado de esta cuenta.
  if (user.emailConfirmed) {
    await getRpc()
      .call("claim_guest_tickets", { p_user_id: user.id })
      .catch((e) => logError("portal.claim", e));
  }
  const staff = await getStaffContext();

  return (
    <div className="flex min-h-svh flex-col pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo className="w-28" />
          <PortalNav variant="top" />
          <div className="flex items-center gap-1">
            {staff && (
              <Button asChild variant="ghost" size="sm" className="rounded-full text-olive">
                <Link href={staffHome(staff.permissions)}>
                  <ShieldCheck /> <span className="hidden sm:inline">Staff</span>
                </Link>
              </Button>
            )}
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="icon" className="rounded-full" aria-label="Cerrar sesión">
                <LogOut />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-10">{children}</main>
      <PortalNav variant="bottom" />
    </div>
  );
}
