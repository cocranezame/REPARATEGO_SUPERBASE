export type PrioridadSolicitud = "BAJA" | "NORMAL" | "ALTA" | "URGENTE";
export type EstadoSolicitudCompra = "PENDIENTE" | "EN_OC" | "COMPLETADA";

export type SolicitudDto = {
  id: string;
  tenant_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad_solicitada: number;
  prioridad: PrioridadSolicitud;
  estado: EstadoSolicitudCompra;
  orden_compra_id: string | null;
  usuario_id: string;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type StockBajoItem = {
  producto_id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
};

export type SolicitudesParams = {
  estado?: EstadoSolicitudCompra;
  prioridad?: PrioridadSolicitud;
  page?: number;
  pageSize?: number;
};

export type SolicitudesListResponse = {
  success: boolean;
  data: SolicitudDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type SolicitudResponse = { success: boolean; data: SolicitudDto };
export type StockBajoResponse = { success: boolean; data: StockBajoItem[] };
