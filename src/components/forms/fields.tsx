"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFormAction } from "@/components/forms/use-form-action";

type FormStateLike = { error?: string; success?: string; warning?: string; fieldErrors?: Record<string, string[]> };
const FieldErrorsContext = createContext<Record<string, string[]>>({});
const PendingContext = createContext(false);
function useFieldError(name: string, explicit?: string[]) {
  const errors = useContext(FieldErrorsContext);
  return explicit ?? errors[name];
}

/** Formulario genérico para Server Actions (prev, FormData) => estado. */
export function ActionForm({
  action,
  children,
  className,
  submitLabel,
  resetKey,
}: {
  action: (prev: FormStateLike, formData: FormData) => Promise<FormStateLike>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  resetKey?: string;
}) {
  const { state, onSubmit, pending } = useFormAction<FormStateLike>(action, {});
  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} key={resetKey}>
      <FieldErrorsContext value={state.fieldErrors ?? {}}>
        <PendingContext value={pending}>
          {children}
          <FormMessage error={state.error} success={state.success} />
          {submitLabel && (
            <SubmitButton pending={pending} className="rounded-full px-6">
              {submitLabel}
            </SubmitButton>
          )}
        </PendingContext>
      </FieldErrorsContext>
    </form>
  );
}

export function Field({
  label,
  name,
  error,
  hint,
  className,
  ...props
}: { label: string; name: string; error?: string[]; hint?: ReactNode } & ComponentProps<typeof Input>) {
  error = useFieldError(name, error);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className="h-11 bg-background" aria-invalid={Boolean(error?.length)} aria-describedby={error ? `${name}-error` : undefined} {...props} />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error?.map((e) => (
        <p key={e} id={`${name}-error`} className="text-xs text-destructive">
          {e}
        </p>
      ))}
    </div>
  );
}

export function TextareaField({
  label,
  name,
  error,
  className,
  ...props
}: { label: string; name: string; error?: string[] } & ComponentProps<typeof Textarea>) {
  error = useFieldError(name, error);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} className="bg-background" aria-invalid={Boolean(error?.length)} {...props} />
      {error?.map((e) => (
        <p key={e} className="text-xs text-destructive">
          {e}
        </p>
      ))}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  error,
  className,
  ...props
}: { label: string; name: string; options: { value: string; label: string }[]; error?: string[] } & ComponentProps<"select">) {
  error = useFieldError(name, error);
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error?.map((e) => (
        <p key={e} className="text-xs text-destructive">
          {e}
        </p>
      ))}
    </div>
  );
}

export function CheckboxField({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--olive)]" />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  pendingText,
  className,
  pending: pendingProp,
  ...props
}: { children: ReactNode; pendingText?: string; pending?: boolean } & ComponentProps<typeof Button>) {
  const status = useFormStatus();
  const ctxPending = useContext(PendingContext);
  const pending = pendingProp ?? (status.pending || ctxPending);
  return (
    <Button type="submit" disabled={pending} className={cn("h-11", className)} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? (pendingText ?? "Guardando…") : children}
    </Button>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn("rounded-lg px-3 py-2.5 text-sm", error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success")}
    >
      {error ?? success}
    </p>
  );
}
