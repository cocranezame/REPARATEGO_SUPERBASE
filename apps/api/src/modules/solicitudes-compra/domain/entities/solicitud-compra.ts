export type PrioridadSolicitud = "BAJA" | "NORMAL" | "ALTA" | "URGENTE";
export type EstadoSolicitudCompra = "PENDIENTE" | "EN_OC" | "COMPLETADA";

export type SolicitudCompra = {
  id: string;
  tenant_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad_solicitada: number;
  prioridad: PrioridadSolicitud;
  estado: EstadoSolicitudCompra;
  orden_compra_id: string | null;
  usuario_id: string;
  usuario_nombre?: string;
  notas: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
