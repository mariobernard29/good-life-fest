import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { WristbandStation } from "@/components/pulseras/wristband-station";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Entrega de pulseras", robots: { index: false } };

export default async function WristbandsPage() {
  const ctx = await requireStaffPage("wristbands.manage", "/pulseras");

  return (
    <div className="min-h-svh bg-ink text-cream">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {hasPermission(ctx.permissions, "dashboard.view") && (
            <Link href="/admin" aria-label="Volver al panel" className="rounded-full p-1.5 hover:bg-cream/10">
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <Logo variant="light" className="w-28" href={null} />
        </div>
        <p className="text-right text-xs text-cream/60">
          Entrega de pulseras
          <br />
          {ctx.user.email}
        </p>
      </header>
      <WristbandStation />
    </div>
  );
}
