"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import { updateProfileAction, type ProfileState } from "@/app/mi-cuenta/actions";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfileAction, {});
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <Field label="Nombre completo" name="fullName" defaultValue={fullName} autoComplete="name" required error={state.fieldErrors?.fullName} />
      <Field label="Teléfono" name="phone" type="tel" defaultValue={phone} autoComplete="tel" error={state.fieldErrors?.phone} />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className="w-full rounded-full">Guardar cambios</SubmitButton>
    </form>
  );
}
