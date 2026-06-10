import type {
  ComponenteOrden,
  CostoRevision,
  CotizacionOrden,
  EvidenciaOrden,
  HistorialOrden,
  Instancia,
  InstanciaImagen,
  ObservacionOrden,
  OrdenServicioDetalle,
  OrdenServicioResumen,
  Periferico,
  PresupuestoBusquedaResult,
  RequerimientoOrden,
  SkuAsignadoOrden,
} from "../entities/servicio.js";

// ─── Instancias ───────────────────────────────────────────────────────────────

export type CreateInstanciaData = {
  cliente_id: string;
  producto_id: string;
  numero_serie?: string | undefined;
};

export type AddInstanciaImagenData = {
  url: string;
  descripcion?: string | undefined;
  orden?: number | undefined;
};

export type ListInstanciasParams = {
  cliente_id?: string | undefined;
  producto_id?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListInstanciasResult = {
  items: Instancia[];
  total: number;
};

// ─── Periféricos ──────────────────────────────────────────────────────────────

export type CreatePerifericoData = {
  categoria_id: string;
  nombre: string;
};

export type UpdatePerifericoData = {
  nombre?: string | undefined;
  activo?: boolean | undefined;
};

export type ListPerifericosParams = {
  categoria_id?: string | undefined;
  activo?: boolean | undefined;
};

// ─── Costo de revisión ────────────────────────────────────────────────────────

export type CreateCostoRevisionData = {
  categoria_id: string;
  monto: number;
};

export type UpdateCostoRevisionData = {
  monto?: number | undefined;
  activo?: boolean | undefined;
};

// ─── Órdenes ──────────────────────────────────────────────────────────────────

export type CreateOrdenData = {
  instancia_id: string;
  sucursal_id?: string | undefined;
  canal: string;
  tipo_servicio: string;
  falla_ingreso: string;
  visita_domicilio_id?: string | undefined;
  lead_id?: string | undefined;
  perifericos?: string[] | undefined;
};

export type UpdateOrdenData = {
  tecnico_id?: string | undefined;
  vendedor_id?: string | undefined;
  diagnostico_tecnico?: string | undefined;
  solucion?: string | undefined;
  sucursal_id?: string | undefined;
};

export type UpdateEstadoOrdenData = {
  estado: string;
  observacion?: string | undefined;
  motivo_devolucion?: string | undefined;
  userId: string;
};

export type UpdateEstadoResult = {
  estado_anterior: string;
  estado_nuevo: string;
  orden_id: string;
  venta_id?: string | undefined;
};

export type ListOrdenesParams = {
  estado?: string | undefined;
  canal?: string | undefined;
  tipo_servicio?: string | undefined;
  tecnico_id?: string | undefined;
  sucursal_id?: string | undefined;
  cliente_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListOrdenesResult = {
  items: OrdenServicioResumen[];
  total: number;
};

// ─── Componentes ──────────────────────────────────────────────────────────────

export type ComponenteItemData = {
  componente_id: string;
  tipo_afectacion: string;
  tipo_accion: string;
  etapa: string;
};

export type UpsertComponentesData = {
  etapa: string;
  items: ComponenteItemData[];
};

// ─── Cotización ───────────────────────────────────────────────────────────────

export type CotizacionItemData = {
  tipo_item: string;
  producto_id?: string | undefined;
  componente_id?: string | undefined;
  descripcion_manual?: string | undefined;
  cantidad: number;
  precio_unitario: number;
  es_preventivo: boolean;
};

export type RegistrarCotizacionData = {
  items: CotizacionItemData[];
  observacion?: string | undefined;
};

export type BuscarPresupuestoParams = {
  tipo?: string | undefined;
  categoria_id?: string | undefined;
  marca_id?: string | undefined;
  modelo_id?: string | undefined;
  componente_id?: string | undefined;
  busqueda?: string | undefined;
  nivel?: string | undefined;
  page: number;
  pageSize: number;
};

// ─── Evidencias ───────────────────────────────────────────────────────────────

export type AddEvidenciaData = {
  url: string;
  etapa?: string | undefined;
  descripcion?: string | undefined;
};

// ─── SKUs asignados ───────────────────────────────────────────────────────────

export type AsignarSkuData = {
  lote_id: string;
  producto_id: string;
  cantidad: number;
  precio_presupuesto: number;
};

// ─── Requerimientos ───────────────────────────────────────────────────────────

export type CreateRequerimientoData = {
  producto_id?: string | undefined;
  imagen_url?: string | undefined;
  descripcion: string;
  cantidad: number;
  observacion?: string | undefined;
};

export type UpdateRequerimientoEstadoData = {
  estado: string;
};

// ─── Aceptaciones ─────────────────────────────────────────────────────────────

export type RegistrarAceptacionData = {
  tipo: string;
  canal_aceptacion: string;
  metodo_aceptacion?: string | undefined;
  evidence_image_url?: string | undefined;
  preventivo_accepted?: boolean | undefined;
  password?: string | undefined;
  ip_address?: string | undefined;
  documento_version?: string | undefined;
  texto_mostrado?: string | undefined;
  manual_reason?: string | undefined;
  userId: string;
};

export type RegistrarAceptacionResult = {
  aceptacion_id: string;
  estado_nuevo: string;
};

// ─── Observaciones ────────────────────────────────────────────────────────────

export type AddObservacionData = {
  etapa: string;
  texto: string;
};

// ─── Port ─────────────────────────────────────────────────────────────────────

export interface IServicioRepository {
  // Instancias
  createInstancia(tenantId: string, data: CreateInstanciaData, userId: string): Promise<Instancia>;
  listInstancias(tenantId: string, params: ListInstanciasParams): Promise<ListInstanciasResult>;
  addInstanciaImagen(
    tenantId: string,
    instanciaId: string,
    data: AddInstanciaImagenData
  ): Promise<InstanciaImagen>;

  // Periféricos
  listPerifericos(tenantId: string, params: ListPerifericosParams): Promise<Periferico[]>;
  createPeriferico(tenantId: string, data: CreatePerifericoData): Promise<Periferico>;
  updatePeriferico(
    tenantId: string,
    id: string,
    data: UpdatePerifericoData
  ): Promise<Periferico | null>;

  // Costos de revisión
  listCostosRevision(tenantId: string): Promise<CostoRevision[]>;
  createCostoRevision(
    tenantId: string,
    data: CreateCostoRevisionData,
    userId: string
  ): Promise<CostoRevision>;
  updateCostoRevision(
    tenantId: string,
    id: string,
    data: UpdateCostoRevisionData
  ): Promise<CostoRevision | null>;

  // Órdenes
  createOrden(
    tenantId: string,
    data: CreateOrdenData,
    userId: string
  ): Promise<OrdenServicioResumen>;
  listOrdenes(tenantId: string, params: ListOrdenesParams): Promise<ListOrdenesResult>;
  findOrdenById(tenantId: string, id: string): Promise<OrdenServicioDetalle | null>;
  updateOrden(
    tenantId: string,
    id: string,
    data: UpdateOrdenData
  ): Promise<OrdenServicioResumen | null>;
  updateEstadoOrden(
    tenantId: string,
    id: string,
    data: UpdateEstadoOrdenData
  ): Promise<UpdateEstadoResult>;

  // Componentes
  upsertComponentes(
    tenantId: string,
    ordenId: string,
    data: UpsertComponentesData,
    userId: string
  ): Promise<ComponenteOrden[]>;
  listComponentes(tenantId: string, ordenId: string): Promise<ComponenteOrden[]>;

  // Cotización / Presupuesto
  buscarPresupuesto(
    tenantId: string,
    params: BuscarPresupuestoParams
  ): Promise<PresupuestoBusquedaResult>;
  registrarCotizacion(
    tenantId: string,
    ordenId: string,
    data: RegistrarCotizacionData
  ): Promise<CotizacionOrden>;
  getOrdenCotizacion(tenantId: string, ordenId: string): Promise<CotizacionOrden>;

  // Evidencias
  addEvidencia(
    tenantId: string,
    ordenId: string,
    data: AddEvidenciaData,
    userId: string
  ): Promise<EvidenciaOrden>;
  listEvidencias(tenantId: string, ordenId: string): Promise<EvidenciaOrden[]>;

  // SKUs
  asignarSku(
    tenantId: string,
    ordenId: string,
    data: AsignarSkuData,
    userId: string
  ): Promise<SkuAsignadoOrden>;
  deleteSku(tenantId: string, ordenId: string, skuId: string): Promise<boolean>;
  listSkus(tenantId: string, ordenId: string): Promise<SkuAsignadoOrden[]>;

  // Requerimientos
  createRequerimiento(
    tenantId: string,
    ordenId: string,
    data: CreateRequerimientoData,
    userId: string
  ): Promise<RequerimientoOrden>;
  listRequerimientos(tenantId: string, ordenId: string): Promise<RequerimientoOrden[]>;
  updateRequerimientoEstado(
    tenantId: string,
    id: string,
    data: UpdateRequerimientoEstadoData
  ): Promise<RequerimientoOrden | null>;

  // Aceptaciones
  registrarAceptacion(
    tenantId: string,
    ordenId: string,
    data: RegistrarAceptacionData
  ): Promise<RegistrarAceptacionResult>;

  // Historial
  listHistorial(tenantId: string, ordenId: string): Promise<HistorialOrden[]>;

  // Observaciones
  addObservacion(
    tenantId: string,
    ordenId: string,
    data: AddObservacionData,
    userId: string
  ): Promise<ObservacionOrden>;
  listObservaciones(tenantId: string, ordenId: string): Promise<ObservacionOrden[]>;
}
