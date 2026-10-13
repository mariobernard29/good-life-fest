"use client";

import Link from "next/link";
import { useFormAction } from "@/components/forms/use-form-action";
import { CheckboxField, Field, FormMessage, SelectField, SubmitButton, TextareaField } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { saveActivityAction, saveConferenceAction } from "@/app/admin/_actions/sessions";
import type { AdminFormState } from "@/app/admin/_actions/form-state";

export type SessionFormValues = {
  id?: string;
  title: string;
  category?: string;
  person: string;
  personBio: string;
  imageUrl: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: number;
  status: string;
  requiresTicket: boolean;
  requiresReservation: boolean;
  waitlistEnabled: boolean;
  cancellationCutoffMinutes: number;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador (no visible)" },
  { value: "published", label: "Publicada (reservable)" },
  { value: "closed", label: "Visible, reservas cerradas" },
];

export function SessionForm({ kind, values, cancelHref }: { kind: "activity" | "conference"; values: SessionFormValues; cancelHref: string }) {
  const { state, onSubmit, pending } = useFormAction<AdminFormState>(kind === "activity" ? saveActivityAction : saveConferenceAction, {});
  const fe = state.fieldErrors ?? {};
  const isActivity = kind === "activity";

  return (
    <form onSubmit={onSubmit} className="space-y-5" key={values.id ?? "new"}>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={isActivity ? "Nombre de la clase" : "Título"} name={isActivity ? "name" : "title"} defaultValue={values.title} required error={fe[isActivity ? "name" : "title"]} />
        {isActivity ? (
          <Field label="Categoría" name="category" defaultValue={values.category} required error={fe.category} hint="Ej. Yoga, Respiración, Taller" />
        ) : (
          <SelectField label="Estado" name="status" defaultValue={values.status === "cancelled" ? "closed" : values.status} options={STATUS_OPTIONS} />
        )}
        <Field label={isActivity ? "Instructor(a)" : "Ponente"} name={isActivity ? "instructor" : "speakerName"} defaultValue={values.person} error={fe[isActivity ? "instructor" : "speakerName"]} />
        <Field label="Ubicación" name="location" defaultValue={values.location} error={fe.location} />
        <Field label="Inicio (hora de Los Mochis)" name="startsAt" type="datetime-local" defaultValue={values.startsAt} required error={fe.startsAt} />
        <Field label="Fin" name="endsAt" type="datetime-local" defaultValue={values.endsAt} required error={fe.endsAt} />
        <Field label="Cupo máximo" name="capacity" type="number" min={0} defaultValue={values.capacity} required error={fe.capacity} />
        <Field
          label="Cierre de cancelación (minutos antes)"
          name="cancellationCutoffMinutes"
          type="number"
          min={0}
          defaultValue={values.cancellationCutoffMinutes}
          error={fe.cancellationCutoffMinutes}
        />
        {isActivity && <SelectField label="Estado" name="status" defaultValue={values.status === "cancelled" ? "closed" : values.status} options={STATUS_OPTIONS} />}
        <Field label={isActivity ? "Imagen (URL, opcional)" : "Foto del ponente (URL, opcional)"} name={isActivity ? "imageUrl" : "speakerPhotoUrl"} defaultValue={values.imageUrl} error={fe[isActivity ? "imageUrl" : "speakerPhotoUrl"]} />
      </div>
      <TextareaField label="Descripción" name="description" defaultValue={values.description} rows={3} error={fe.description} />
      <TextareaField label={isActivity ? "Semblanza del instructor" : "Biografía del ponente"} name={isActivity ? "instructorBio" : "speakerBio"} defaultValue={values.personBio} rows={2} />

      <div className="grid gap-2 sm:grid-cols-3">
        {!isActivity && <CheckboxField label="Requiere reserva" name="requiresReservation" defaultChecked={values.requiresReservation} hint="Si no, es de acceso libre con entrada." />}
        <CheckboxField label="Requiere entrada válida" name="requiresTicket" defaultChecked={values.requiresTicket} />
        <CheckboxField label="Lista de espera" name="waitlistEnabled" defaultChecked={values.waitlistEnabled} hint="Al liberarse un lugar se asigna al primero en espera (FIFO)." />
      </div>

      {state.needsCapacityResolution && (
        <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium">
            Hay {state.needsCapacityResolution.confirmed} reservas confirmadas y el nuevo cupo es menor. ¿Cómo resolverlo?
          </p>
          <label className="flex items-start gap-2">
            <input type="radio" name="capacityResolution" value="move_excess_to_waitlist" required className="mt-1" />
            <span>Pasar las reservas más recientes a lista de espera (las primeras conservan su lugar).</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="capacityResolution" value="keep_existing" className="mt-1" />
            <span>Mantener todas las reservas actuales (sobrecupo temporal; no se aceptarán nuevas hasta liberar lugares).</span>
          </label>
        </div>
      )}

      <FormMessage error={state.error} success={state.success} />
      <div className="flex gap-2">
        <SubmitButton pending={pending} className="rounded-full px-6">{values.id ? "Guardar cambios" : "Crear"}</SubmitButton>
        <Button asChild variant="ghost" className="h-11">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
