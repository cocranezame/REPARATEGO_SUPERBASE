export type InstanciaImagen = {
  id: string;
  instancia_id: string;
  url: string;
  descripcion?: string | undefined;
  orden: number;
  created_at: Date;
};

export type Instancia = {
  id: string;
  tenant_id: string;
  cliente_id: string;
  cliente_nombre?: string | undefined;
  producto_id: string;
  producto_nombre?: string | undefined;
  categoria_id?: string | undefined;
  numero_serie?: string | undefined;
  activo: boolean;
  imagenes: InstanciaImagen[];
  created_at: Date;
  updated_at: Date;
};

export type Periferico = {
  id: string;
  tenant_id: string;
  categoria_id: string;
  nombre: string;
  activo: boolean;
  created_at: Date;
};

export type CostoRevision = {
  id: string;
  tenant_id: string;
  categoria_id: string;
  categoria_nombre?: string | undefined;
  monto: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type OrdenServicioResumen = {
  id: string;
  tenant_id: string;
  codigo: string;
  instancia_id: string;
  cliente_id: string;
  cliente_nombre?: string | undefined;
  producto_id: string;
  producto_nombre?: string | undefined;
  numero_serie?: string | undefined;
  sucursal_id?: string | undefined;
  canal: string;
  tipo_servicio: string;
  falla_ingreso: string;
  costo_revision: string;
  estado: string;
  motivo_devolucion?: string | undefined;
  tecnico_id?: string | undefined;
  tecnico_nombre?: string | undefined;
  venta_id?: string | undefined;
  venta_estado?: string | undefined;
  imagen_url?: string | undefined;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type ComponenteOrden = {
  id: string;
  orden_servicio_id: string;
  componente_id: string;
  componente_nombre?: string | undefined;
  tipo_afectacion: string;
  tipo_accion: string;
  etapa: string;
  created_at: Date;
};

export type CotizacionItemOrden = {
  id: string;
  orden_servicio_id: string;
  tipo_item: string;
  producto_id?: string | undefined;
  producto_nombre?: string | undefined;
  componente_id?: string | undefined;
  componente_nombre?: string | undefined;
  descripcion_manual?: string | undefined;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  es_preventivo: boolean;
  created_at: Date;
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
  etapa?: string | undefined;
  descripcion?: string | undefined;
  created_by?: string | undefined;
  created_at: Date;
};

export type SkuAsignadoOrden = {
  id: string;
  orden_servicio_id: string;
  lote_id: string;
  producto_id: string;
  producto_nombre?: string | undefined;
  cantidad: number;
  precio_presupuesto: string;
  estado: string;
  created_at: Date;
  updated_at: Date;
};

export type RequerimientoOrden = {
  id: string;
  orden_servicio_id: string;
  producto_id?: string | undefined;
  producto_nombre?: string | undefined;
  imagen_url?: string | undefined;
  descripcion: string;
  cantidad: number;
  observacion?: string | undefined;
  estado: string;
  created_at: Date;
  updated_at: Date;
};

export type AceptacionOrden = {
  id: string;
  orden_servicio_id: string;
  tipo: string;
  canal_aceptacion: string;
  accepted_at: Date;
  ip_address?: string | undefined;
  metodo_aceptacion?: string | undefined;
  approved_by?: string | undefined;
  preventivo_accepted?: boolean | undefined;
  created_at: Date;
};

export type HistorialOrden = {
  id: string;
  orden_servicio_id: string;
  estado_anterior: string;
  estado_nuevo: string;
  usuario_id: string;
  usuario_nombre?: string | undefined;
  observacion?: string | undefined;
  created_at: Date;
};

export type ObservacionOrden = {
  id: string;
  orden_servicio_id: string;
  etapa: string;
  texto: string;
  usuario_id: string;
  usuario_nombre?: string | undefined;
  created_at: Date;
};

export type OrdenServicioDetalle = OrdenServicioResumen & {
  diagnostico_tecnico?: string | undefined;
  solucion?: string | undefined;
  vendedor_id?: string | undefined;
  preventivo_accepted?: boolean | undefined;
  orden_padre_id?: string | undefined;
  visita_domicilio_id?: string | undefined;
  lead_id?: string | undefined;
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
  componente_id?: string | undefined;
  componente_nombre?: string | undefined;
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
