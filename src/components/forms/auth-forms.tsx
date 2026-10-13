"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/forms/fields";
import {
  loginAction,
  recoverAction,
  registerAction,
  updatePasswordAction,
  type FormState,
} from "@/app/(auth)/actions";

const initial: FormState = {};

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4">
      {notice && <FormMessage success={notice} />}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Correo electrónico" name="email" type="email" autoComplete="email" inputMode="email" required defaultValue={state.values?.email} error={state.fieldErrors?.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required error={state.fieldErrors?.password} />
      <div className="flex justify-end">
        <Link href="/recuperar-contrasena" className="text-sm text-olive hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
      <FormMessage error={state.error} />
      <SubmitButton className="w-full rounded-full" pendingText="Entrando…">
        Iniciar sesión
      </SubmitButton>
    </form>
  );
}

export function RegisterForm({ email }: { email?: string }) {
  const [state, action] = useActionState(registerAction, initial);
  if (state.success) return <FormMessage success={state.success} />;
  return (
    <form action={action} className="space-y-4">
      <Field label="Nombre completo" name="fullName" autoComplete="name" required defaultValue={state.values?.fullName} error={state.fieldErrors?.fullName} />
      <Field
        label="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email ?? email}
        error={state.fieldErrors?.email}
        hint="Usa el mismo correo de tu compra para ver tus entradas."
      />
      <Field label="Teléfono (opcional)" name="phone" type="tel" autoComplete="tel" defaultValue={state.values?.phone} error={state.fieldErrors?.phone} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" required error={state.fieldErrors?.password} hint="Mínimo 8 caracteres." />
      <Field label="Confirmar contraseña" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
      <FormMessage error={state.error} />
      <SubmitButton className="w-full rounded-full" pendingText="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}

export function RecoverForm() {
  const [state, action] = useActionState(recoverAction, initial);
  return (
    <form action={action} className="space-y-4">
      <Field label="Correo electrónico" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton className="w-full rounded-full" pendingText="Enviando…">
        Enviar enlace
      </SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, initial);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" required error={state.fieldErrors?.password} />
      <Field label="Confirmar contraseña" name="confirmPassword" type="password" autoComplete="new-password" required error={state.fieldErrors?.confirmPassword} />
      <FormMessage error={state.error} />
      <SubmitButton className="w-full rounded-full">Guardar contraseña</SubmitButton>
    </form>
  );
}
