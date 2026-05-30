import type { SolicitudCompra } from "../entities/solicitud-compra.js";

export type ListSolicitudesParams = {
  page: number;
  pageSize: number;
  estado?: string;
  prioridad?: string;
};

export type ListSolicitudesResult = {
  items: SolicitudCompra[];
  total: number;
};

export type CreateSolicitudData = {
  producto_id: string;
  cantidad_solicitada: number;
  prioridad?: string;
  usuario_id: string;
  notas?: string;
};

export type UpdateSolicitudData = {
  cantidad_solicitada?: number | undefined;
  prioridad?: string | undefined;
  notas?: string | undefined;
};

export interface ISolicitudCompraRepository {
  list(tenantId: string, params: ListSolicitudesParams): Promise<ListSolicitudesResult>;
  findById(tenantId: string, id: string): Promise<SolicitudCompra | null>;
  create(tenantId: string, data: CreateSolicitudData): Promise<SolicitudCompra>;
  update(tenantId: string, id: string, data: UpdateSolicitudData): Promise<SolicitudCompra | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
  listStockBajo(
    tenantId: string
  ): Promise<
    Array<{ producto_id: string; nombre: string; stock_actual: number; stock_minimo: number }>
  >;
}
