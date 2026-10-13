import type { Metadata } from "next";
import { ContentAdmin } from "@/components/admin/content-admin";
import { requireStaffPage } from "@/lib/auth/staff";

export const metadata: Metadata = { title: "Patrocinadores" };

export default async function SponsorsAdminPage({ searchParams }: PageProps<"/admin/patrocinadores">) {
  const ctx = await requireStaffPage("content.manage", "/admin/patrocinadores");
  return <ContentAdmin kind="sponsor" event={ctx.event} sp={await searchParams} />;
}
