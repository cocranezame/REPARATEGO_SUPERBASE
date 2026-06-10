// C002 — tipos para módulo servicios (/servicios-v2/)

export type EstadoOS =
  | "VALIDACION"
  | "REVISION"
  | "DIAG_PRELIMINAR"
  | "DIAG_FINAL"
  | "COTIZADO"
  | "APROBADO"
  | "AGREGAR_SKU"
  | "PRIORIDAD"
  | "REPARADO"
  | "AVISADO"
  | "ENTREGADO"
  | "GARANTIA"
  | "DEVOLUCION";

export type EstadoRequerimiento = "PENDIENTE" | "EN_COMPRA" | "ATENDIDO" | "ANULADO";

export type InstanciaImagen = {
  id: string;
  instancia_id: string;
  url: string;
  descripcion?: string;
  orden: number;
  created_at: string;
};

export type Instancia = {
  id: string;
  tenant_id: string;
  cliente_id: string;
  cliente_nombre?: string;
  producto_id: string;
  producto_nombre?: string;
  categoria_id?: string;
  numero_serie?: string;
  activo: boolean;
  imagenes: InstanciaImagen[];
  created_at: string;
  updated_at: string;
};

export type CostoRevision = {
  id: string;
  categoria_id: string;
  categoria_nombre?: string;
  monto: string;
  activo: boolean;
};

export type Periferico = {
  id: string;
  categoria_id: string;
  nombre: string;
  activo: boolean;
};

export type ComponenteOrden = {
  id: string;
  orden_servicio_id: string;
  componente_id: string;
  componente_nombre?: string;
  tipo_afectacion: "PREVENTIVO" | "CORRECTIVO";
  tipo_accion: "REPARACION" | "CAMBIO";
  etapa: "PRELIMINAR" | "FINAL";
  created_at: string;
};

export type CotizacionItemOrden = {
  id: string;
  orden_servicio_id: string;
  tipo_item: "REPUESTO" | "SERVICIO" | "MANUAL";
  producto_id?: string;
  producto_nombre?: string;
  componente_id?: string;
  componente_nombre?: string;
  descripcion_manual?: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  es_preventivo: boolean;
  created_at: string;
};

export type CotizacionOrden = {
  items: CotizacionItemOrden[];
  total_correctivo: string;
  total_preventivo: string;
  total: string;
};

export type EvidenciaOrden = {
  id: string;
  orden_servicio_id: string;
  url: string;
  etapa?: string;
  descripcion?: string;
  created_at: string;
};

export type SkuAsignadoOrden = {
  id: string;
  orden_servicio_id: string;
  lote_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad: number;
  precio_presupuesto: string;
  estado: string;
  created_at: string;
};

export type RequerimientoOrden = {
  id: string;
  orden_servicio_id: string;
  producto_id?: string;
  producto_nombre?: string;
  imagen_url?: string;
  descripcion: string;
  cantidad: number;
  observacion?: string;
  estado: EstadoRequerimiento;
  created_at: string;
};

export type AceptacionOrden = {
  id: string;
  orden_servicio_id: string;
  tipo: string;
  canal_aceptacion: string;
  accepted_at: string;
  preventivo_accepted?: boolean;
  created_at: string;
};

export type HistorialOrden = {
  id: string;
  orden_servicio_id: string;
  estado_anterior: string;
  estado_nuevo: string;
  usuario_id: string;
  usuario_nombre?: string;
  observacion?: string;
  created_at: string;
};

export type ObservacionOrden = {
  id: string;
  orden_servicio_id: string;
  etapa: string;
  texto: string;
  usuario_id: string;
  usuario_nombre?: string;
  created_at: string;
};

export type OrdenServicioResumen = {
  id: string;
  tenant_id: string;
  codigo: string;
  instancia_id: string;
  cliente_id: string;
  cliente_nombre?: string;
  producto_id: string;
  producto_nombre?: string;
  numero_serie?: string;
  sucursal_id?: string;
  canal: "TIENDA" | "DOMICILIO";
  tipo_servicio: string;
  falla_ingreso: string;
  costo_revision: string;
  estado: EstadoOS;
  motivo_devolucion?: string;
  tecnico_id?: string;
  tecnico_nombre?: string;
  venta_id?: string;
  venta_estado?: string;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type OrdenServicioDetalle = OrdenServicioResumen & {
  diagnostico_tecnico?: string;
  solucion?: string;
  vendedor_id?: string;
  preventivo_accepted?: boolean;
  orden_padre_id?: string;
  visita_domicilio_id?: string;
  lead_id?: string;
  imagenes_instancia: InstanciaImagen[];
  componentes: ComponenteOrden[];
  cotizacion: CotizacionOrden;
  evidencias: EvidenciaOrden[];
  skus: SkuAsignadoOrden[];
  requerimientos: RequerimientoOrden[];
  aceptaciones: AceptacionOrden[];
  historial: HistorialOrden[];
  observaciones: ObservacionOrden[];
};

export type PresupuestoItem = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  categoria_id: string;
  componente_id?: string;
  componente_nombre?: string;
  precio_venta: string;
  stock_disponible: boolean;
  stock_total: number;
  nivel_alcance: string;
};

export type PresupuestoBusquedaResult = {
  items: PresupuestoItem[];
  total: number;
  counts: {
    compatibilidad: number;
    marca: number;
    categoria: number;
    global: number;
  };
};

// ─── Params ───────────────────────────────────────────────────────────────────

export type ListOrdenesParams = {
  estado?: EstadoOS;
  canal?: string;
  tipo_servicio?: string;
  tecnico_id?: string;
  sucursal_id?: string;
  cliente_id?: string;
  desde?: string;
  hasta?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type ListInstanciasParams = {
  cliente_id?: string;
  producto_id?: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
};

export type BuscarPresupuestoParams = {
  tipo?: "REPUESTO" | "SERVICIO";
  categoria_id?: string;
  marca_id?: string;
  modelo_id?: string;
  componente_id?: string;
  busqueda?: string;
  nivel?: "COMPAT" | "MARCA" | "CATEGORIA" | "GLOBAL";
  page?: number;
  pageSize?: number;
};

// ─── API responses ────────────────────────────────────────────────────────────

export type ApiOk<T> = { success: boolean; data: T };
export type ApiList<T> = {
  success: boolean;
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};
