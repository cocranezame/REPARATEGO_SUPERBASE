export const ESTADO_LABELS: Record<string, string> = {
  RECIBIDO: "Recibido",
  VALIDACION: "Pendiente de validación",
  REVISION: "En revisión",
  DIAG_EXTERNO: "Diagnóstico externo",
  COTIZADO: "Presupuesto enviado",
  APROBADO: "Aprobado",
  AGREGAR_SKU: "Preparando repuestos",
  PRIORIDAD: "En reparación prioritaria",
  REPARADO: "Listo para recoger",
  AVISADO: "Te hemos avisado",
  ENTREGADO: "Entregado",
  DEVOLUCION: "Devolución",
  SIN_REPARACION: "Sin reparación",
};

export function estadoLabel(estado: string): string {
  return ESTADO_LABELS[estado] ?? estado;
}

// Returns Tailwind badge classes for each estado
export function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case "RECIBIDO":
      return "bg-neutral-100 text-neutral-700";
    case "VALIDACION":
      return "bg-amber-100 text-amber-700";
    case "REVISION":
    case "DIAG_EXTERNO":
      return "bg-blue-100 text-blue-700";
    case "COTIZADO":
      return "bg-purple-100 text-purple-700";
    case "APROBADO":
    case "AGREGAR_SKU":
    case "PRIORIDAD":
      return "bg-indigo-100 text-indigo-700";
    case "REPARADO":
    case "AVISADO":
      return "bg-green-100 text-green-700";
    case "ENTREGADO":
      return "bg-teal-100 text-teal-700";
    case "DEVOLUCION":
    case "SIN_REPARACION":
      return "bg-red-100 text-red-700";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

// States where diagnostic/cotizacion data is populated
export const ESTADOS_CON_COTIZACION = new Set([
  "COTIZADO",
  "APROBADO",
  "AGREGAR_SKU",
  "PRIORIDAD",
  "REPARADO",
  "AVISADO",
  "ENTREGADO",
  "DEVOLUCION",
]);

// States where sucursal address is shown (ready to pick up)
export const ESTADOS_LISTO = new Set(["REPARADO", "AVISADO"]);
