export type EstadoOrdenServicio =
  | "RECEPCION"
  | "EN_DIAGNOSTICO"
  | "DIAGNOSTICADO"
  | "COTIZADO"
  | "APROBADO"
  | "EN_REPARACION"
  | "REPARADO"
  | "LISTO_ENTREGA"
  | "ENTREGADO"
  | "DEVOLUCION"
  | "CANCELADO";

export type OrdenServicioComponenteDto = {
  id: string;
  orden_servicio_id: string;
  componente_id: string;
  componente_nombre?: string;
  es_preliminar: boolean;
  estado_componente: string;
  notas: string | null;
  created_at: string;
};

export type OrdenServicioCotizacionDto = {
  id: string;
  orden_servicio_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  tipo: string;
  aprobado_cliente: boolean | null;
  created_at: string;
  updated_at: string;
};

export type OrdenServicioEvidenciaDto = {
  id: string;
  orden_servicio_id: string;
  url: string;
  tipo_archivo: string;
  momento: string;
  descripcion: string | null;
  usuario_id: string;
  created_at: string;
};

export type OrdenServicioDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  sucursal_id: string;
  cliente_id: string;
  cliente_nombre?: string;
  tecnico_id: string | null;
  tecnico_nombre?: string;
  recibido_por_id: string;
  categoria_id: string;
  categoria_nombre?: string;
  marca_id: string | null;
  marca_nombre?: string;
  modelo_id: string | null;
  modelo_nombre?: string;
  serie_equipo: string | null;
  color_equipo: string | null;
  estado: EstadoOrdenServicio;
  problema_reportado: string;
  diagnostico_tecnico: string | null;
  solucion_aplicada: string | null;
  tipo_servicio: string;
  fecha_recepcion: string;
  fecha_diagnostico: string | null;
  fecha_inicio_reparacion: string | null;
  fecha_terminado: string | null;
  fecha_entrega: string | null;
  prioridad: string;
  notas_internas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  componentes?: OrdenServicioComponenteDto[];
  cotizacion?: OrdenServicioCotizacionDto[];
  evidencias?: OrdenServicioEvidenciaDto[];
};

export type OrdenesServicioParams = {
  estado?: EstadoOrdenServicio;
  tecnico_id?: string;
  sucursal_id?: string;
  cliente_id?: string;
  desde?: string;
  hasta?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type OrdenesServicioListResponse = {
  success: boolean;
  data: OrdenServicioDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type OrdenServicioResponse = {
  success: boolean;
  data: OrdenServicioDto;
};

export type CotizacionResponse = {
  success: boolean;
  data: OrdenServicioCotizacionDto[];
  totales: { subtotal: string; igv: string; total: string };
};
