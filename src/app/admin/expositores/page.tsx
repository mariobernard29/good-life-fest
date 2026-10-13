import type { Metadata } from "next";
import { ContentAdmin } from "@/components/admin/content-admin";
import { requireStaffPage } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Expositores" };

export default async function ExhibitorsAdminPage({ searchParams }: PageProps<"/admin/expositores">) {
  const ctx = await requireStaffPage("content.manage", "/admin/expositores");
  return <ContentAdmin kind="exhibitor" event={ctx.event} sp={await searchParams} />;
}
