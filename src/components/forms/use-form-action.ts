"use client";

import { useActionState, startTransition, type FormEvent } from "react";

/**
 * Igual que useActionState, pero envía el formulario sin el reinicio automático de
 * React 19, para conservar lo capturado cuando el servidor devuelve errores.
 */
export function useFormAction<S extends object>(action: (prev: S, formData: FormData) => Promise<S>, initial: S) {
  const [state, dispatch, pending] = useActionState<S, FormData>(action, initial as Awaited<S>);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(formData));
  };
  return { state, onSubmit, pending };
}
