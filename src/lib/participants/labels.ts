/** Etiquetas compartidas por el admin y las exportaciones (sin dependencias de UI). */
export const SALE_SOURCE_LABEL: Record<string, string> = {
  punto_fisico: "Punto físico",
  mensaje: "Por mensaje",
};

export function wristbandLabel(deliveredAt: string | null | undefined): "Entregada" | "Pendiente" {
  return deliveredAt ? "Entregada" : "Pendiente";
}
