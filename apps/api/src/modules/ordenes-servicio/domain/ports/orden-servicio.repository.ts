import type {
  OrdenServicio,
  OrdenServicioComponente,
  OrdenServicioCotizacion,
  OrdenServicioDetalle,
  OrdenServicioEvidencia,
} from "../entities/orden-servicio.js";

export type CreateOrdenServicioData = {
  cliente_id: string;
  sucursal_id: string;
  recibido_por_id: string;
  categoria_id: string;
  marca_id?: string | undefined;
  modelo_id?: string | undefined;
  serie_equipo?: string | undefined;
  color_equipo?: string | undefined;
  problema_reportado: string;
  tipo_servicio?: string | undefined;
  prioridad?: string | undefined;
  notas_internas?: string | undefined;
};

export type UpdateOrdenServicioData = {
  tecnico_id?: string | undefined;
  diagnostico_tecnico?: string | undefined;
  solucion_aplicada?: string | undefined;
  notas_internas?: string | undefined;
  prioridad?: string | undefined;
};

export type UpdateEstadoData = {
  estado: string;
  notas?: string | undefined;
};

export type AddComponenteItem = {
  componente_id: string;
  es_preliminar: boolean;
  estado_componente: string;
  notas?: string | undefined;
};

export type CotizacionItem = {
  producto_id?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  tipo: string;
};

export type AddEvidenciaData = {
  url: string;
  tipo_archivo: string;
  momento: string;
  descripcion?: string | undefined;
  usuario_id: string;
};

export type ListOrdenesServicioParams = {
  estado?: string | undefined;
  tecnico_id?: string | undefined;
  sucursal_id?: string | undefined;
  cliente_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListOrdenesServicioResult = {
  items: OrdenServicio[];
  total: number;
};

export interface IOrdenServicioRepository {
  list(tenantId: string, params: ListOrdenesServicioParams): Promise<ListOrdenesServicioResult>;
  findById(tenantId: string, id: string): Promise<OrdenServicioDetalle | null>;
  create(tenantId: string, data: CreateOrdenServicioData): Promise<OrdenServicio>;
  update(
    tenantId: string,
    id: string,
    data: UpdateOrdenServicioData
  ): Promise<OrdenServicio | null>;
  updateEstado(tenantId: string, id: string, data: UpdateEstadoData): Promise<OrdenServicio | null>;
  addComponentes(
    tenantId: string,
    ordenId: string,
    items: AddComponenteItem[]
  ): Promise<OrdenServicioComponente[]>;
  listComponentes(tenantId: string, ordenId: string): Promise<OrdenServicioComponente[]>;
  listCotizacion(tenantId: string, ordenId: string): Promise<OrdenServicioCotizacion[]>;
  addCotizacion(
    tenantId: string,
    ordenId: string,
    items: CotizacionItem[]
  ): Promise<OrdenServicioCotizacion[]>;
  aprobarCotizacion(
    tenantId: string,
    ordenId: string,
    aprobado: boolean
  ): Promise<OrdenServicio | null>;
  listEvidencias(tenantId: string, ordenId: string): Promise<OrdenServicioEvidencia[]>;
  addEvidencia(
    tenantId: string,
    ordenId: string,
    data: AddEvidenciaData
  ): Promise<OrdenServicioEvidencia>;
  deleteEvidencia(tenantId: string, ordenId: string, evidenciaId: string): Promise<boolean>;
}
