import type { CotizacionCompra } from "../entities/cotizacion-compra.js";

export type CreateCotizacionCompraData = {
  proveedor_id: string;
  producto_id: string;
  precio_unitario?: number;
  notas?: string;
};

export type UpdateCotizacionCompraData = {
  precio_unitario?: number;
  notas?: string;
};

export type ListCotizacionesParams = {
  page: number;
  pageSize: number;
  proveedor_id?: string;
  producto_id?: string;
};

export type ListCotizacionesResult = {
  items: CotizacionCompra[];
  total: number;
};

export interface ICotizacionCompraRepository {
  list(tenantId: string, params: ListCotizacionesParams): Promise<ListCotizacionesResult>;
  findById(tenantId: string, id: string): Promise<CotizacionCompra | null>;
  create(tenantId: string, data: CreateCotizacionCompraData): Promise<CotizacionCompra>;
  update(
    tenantId: string,
    id: string,
    data: UpdateCotizacionCompraData
  ): Promise<CotizacionCompra | null>;
  delete(tenantId: string, id: string): Promise<boolean>;
  getWhatsapp(tenantId: string, id: string): Promise<{ url: string }>;
}
