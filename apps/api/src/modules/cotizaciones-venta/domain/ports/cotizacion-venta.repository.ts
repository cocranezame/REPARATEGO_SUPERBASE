import type { CotizacionVenta, CotizacionVentaDetalle } from "../entities/cotizacion-venta.js";

export type CreateCotizacionVentaItemData = {
  produto_id?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

export type CreateCotizacionVentaData = {
  caja_id: string;
  created_by: string;
  cliente_id?: string | undefined;
  items: CreateCotizacionVentaItemData[];
};

export type ListCotizacionesVentaParams = {
  cliente_id?: string | undefined;
  fecha_desde?: string | undefined;
  fecha_hasta?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListCotizacionesVentaResult = {
  items: CotizacionVenta[];
  total: number;
};

export interface ICotizacionVentaRepository {
  list(tenantId: string, params: ListCotizacionesVentaParams): Promise<ListCotizacionesVentaResult>;
  findById(tenantId: string, id: string): Promise<CotizacionVentaDetalle | null>;
  create(tenantId: string, data: CreateCotizacionVentaData): Promise<CotizacionVentaDetalle>;
}
