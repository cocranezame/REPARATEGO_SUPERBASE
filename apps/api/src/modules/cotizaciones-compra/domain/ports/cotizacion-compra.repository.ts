import type { CotizacionCompra, CotizacionCompraDetalle } from "../entities/cotizacion-compra.js";

export type CreateCotizacionCompraData = {
  proveedor_id: string;
  usuario_id: string;
  items: Array<{ producto_id: string; cantidad: number }>;
  fecha_vencimiento?: string;
  notas?: string;
};

export type CotizarItemData = {
  detalle_id: string;
  precio_unitario: number;
};

export type ListCotizacionesParams = {
  page: number;
  pageSize: number;
  proveedor_id?: string;
  estado?: string;
};

export type ListCotizacionesResult = {
  items: CotizacionCompra[];
  total: number;
};

export interface ICotizacionCompraRepository {
  list(tenantId: string, params: ListCotizacionesParams): Promise<ListCotizacionesResult>;
  findById(tenantId: string, id: string): Promise<CotizacionCompra | null>;
  create(tenantId: string, data: CreateCotizacionCompraData): Promise<CotizacionCompra>;
  cotizar(tenantId: string, id: string, items: CotizarItemData[]): Promise<CotizacionCompra | null>;
  listDetalles(tenantId: string, cotizacionId: string): Promise<CotizacionCompraDetalle[]>;
}
