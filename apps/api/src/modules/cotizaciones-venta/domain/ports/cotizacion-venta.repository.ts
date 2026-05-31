import type { CotizacionVenta, CotizacionVentaDetalle } from "../entities/cotizacion-venta.js";

export type CreateCotizacionVentaItemData = {
  producto_id?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

export type CreateCotizacionVentaData = {
  usuario_id: string;
  cliente_id?: string | undefined;
  items: CreateCotizacionVentaItemData[];
  fecha_vencimiento?: string | undefined;
  notas?: string | undefined;
};

export type ListCotizacionesVentaParams = {
  cliente_id?: string | undefined;
  estado?: string | undefined;
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
  updateEstado(tenantId: string, id: string, estado: string): Promise<CotizacionVenta | null>;
}
