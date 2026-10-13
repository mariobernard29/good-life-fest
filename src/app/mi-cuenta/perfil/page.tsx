import type { Metadata } from "next";
import { requireUserPage } from "@/lib/auth/session";
import { getMyProfile } from "@/lib/portal/queries";
import { ProfileForm } from "@/components/portal/profile-form";
import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const user = await requireUserPage("/mi-cuenta/perfil");
  const profile = await getMyProfile(user.id);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <p className="eyebrow">Perfil</p>
        <h1 className="display mt-1 text-4xl sm:text-5xl">Tus datos</h1>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs text-muted-foreground">Correo de la cuenta</p>
        <p className="font-medium">{user.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">{user.emailConfirmed ? "Correo verificado" : "Correo sin verificar: revisa tu bandeja de entrada."}</p>
      </div>
      <ProfileForm fullName={profile?.full_name ?? ""} phone={profile?.phone ?? ""} />
      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="h-11 w-full rounded-full">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
