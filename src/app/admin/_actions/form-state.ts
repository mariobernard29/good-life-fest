export type AdminFormState = {
  error?: string;
  success?: string;
  warning?: string;
  fieldErrors?: Record<string, string[]>;
  /** Señala que el cupo nuevo es menor que las reservas y se requiere resolución. */
  needsCapacityResolution?: { confirmed: number };
};
