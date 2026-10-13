import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { CheckInStation } from "@/components/checkin/check-in-station";
import { requireStaffPage } from "@/lib/auth/staff";
import { hasPermission } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Control de acceso", robots: { index: false } };

export default async function CheckInPage() {
  const ctx = await requireStaffPage("checkin.perform", "/check-in");
  const { data } = await createAdminClient().from("ticket_types").select("access_areas").eq("event_id", ctx.event.id);
  const areas = [...new Set((data ?? []).flatMap((t) => t.access_areas as string[]))].sort((a, b) => (a === "general" ? -1 : b === "general" ? 1 : a.localeCompare(b)));

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
          Control de acceso
          <br />
          {ctx.user.email}
        </p>
      </header>
      <CheckInStation areas={areas.length ? areas : ["general"]} />
    </div>
  );
}
