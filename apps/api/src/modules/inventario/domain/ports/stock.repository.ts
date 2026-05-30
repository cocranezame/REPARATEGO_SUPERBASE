import type { Lote } from "../entities/lote.js";
import type { MovimientoInventario, TipoMovimiento } from "../entities/movimiento-inventario.js";
import type { LoteDetalle, StockItem } from "../entities/stock.js";

export type ListStockParams = {
  producto_id?: string;
  sucursal_id?: string;
  alerta_minimo?: boolean;
};

export type ListLotesParams = {
  page: number;
  pageSize: number;
  producto_id?: string;
  sucursal_id?: string;
};

export type ListLotesResult = {
  items: Lote[];
  total: number;
};

export type CreateLoteData = {
  producto_id: string;
  sucursal_id: string;
  orden_compra_id?: string | undefined;
  cantidad: number;
  precio_unitario: number;
  fecha_ingreso: string;
  fecha_vencimiento?: string | undefined;
  usuario_id: string;
};

export type ListMovimientosParams = {
  page: number;
  pageSize: number;
  producto_id?: string;
  tipo?: TipoMovimiento;
  sucursal_id?: string;
  desde?: string;
  hasta?: string;
};

export type ListMovimientosResult = {
  items: MovimientoInventario[];
  total: number;
};

export type CreateMovimientoData = {
  producto_id: string;
  lote_id?: string | undefined;
  sucursal_id: string;
  tipo: "MERMA" | "REAJUSTE" | "TRANSFERENCIA";
  cantidad: number;
  referencia_tipo?: string | undefined;
  referencia_id?: string | undefined;
  notas?: string | undefined;
  usuario_id: string;
};

export interface IStockRepository {
  listStock(tenantId: string, params: ListStockParams): Promise<StockItem[]>;
  getStockDetalle(tenantId: string, productoId: string): Promise<LoteDetalle[]>;
  listLotes(tenantId: string, params: ListLotesParams): Promise<ListLotesResult>;
  createLote(tenantId: string, data: CreateLoteData): Promise<Lote>;
  listMovimientos(tenantId: string, params: ListMovimientosParams): Promise<ListMovimientosResult>;
  createMovimiento(tenantId: string, data: CreateMovimientoData): Promise<MovimientoInventario>;
}
