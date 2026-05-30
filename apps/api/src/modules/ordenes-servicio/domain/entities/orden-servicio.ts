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

export type TipoServicio = "CORRECTIVO" | "PREVENTIVO";

export type OrdenServicio = {
  id: string;
  tenant_id: string;
  codigo: string;
  sucursal_id: string;
  cliente_id: string;
  tecnico_id: string | null;
  recibido_por_id: string;
  categoria_id: string;
  marca_id: string | null;
  modelo_id: string | null;
  serie_equipo: string | null;
  color_equipo: string | null;
  estado: EstadoOrdenServicio;
  problema_reportado: string;
  diagnostico_tecnico: string | null;
  solucion_aplicada: string | null;
  tipo_servicio: TipoServicio;
  fecha_recepcion: Date;
  fecha_diagnostico: Date | null;
  fecha_inicio_reparacion: Date | null;
  fecha_terminado: Date | null;
  fecha_entrega: Date | null;
  prioridad: string;
  visita_domicilio_id: string | null;
  notas_internas: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  cliente_nombre?: string | undefined;
  tecnico_nombre?: string | undefined;
  categoria_nombre?: string | undefined;
  marca_nombre?: string | undefined;
  modelo_nombre?: string | undefined;
};

export type OrdenServicioComponente = {
  id: string;
  tenant_id: string;
  orden_servicio_id: string;
  componente_id: string;
  componente_nombre?: string | undefined;
  es_preliminar: boolean;
  estado_componente: string;
  notas: string | null;
  created_at: Date;
};

export type OrdenServicioCotizacion = {
  id: string;
  tenant_id: string;
  orden_servicio_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  tipo: string;
  aprobado_cliente: boolean | null;
  created_at: Date;
  updated_at: Date;
};

export type OrdenServicioEvidencia = {
  id: string;
  tenant_id: string;
  orden_servicio_id: string;
  url: string;
  tipo_archivo: string;
  momento: string;
  descripcion: string | null;
  usuario_id: string;
  created_at: Date;
};

export type OrdenServicioDetalle = OrdenServicio & {
  componentes: OrdenServicioComponente[];
  cotizacion: OrdenServicioCotizacion[];
  evidencias: OrdenServicioEvidencia[];
};
