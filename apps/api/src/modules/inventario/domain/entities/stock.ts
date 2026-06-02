export type StockItem = {
  producto_id: string;
  nombre: string;
  codigo: string;
  sucursal_id: string;
  sucursal_nombre?: string | undefined;
  stock_actual: number;
  stock_minimo: number;
  en_alerta: boolean;
};

export type AlertaStock = {
  producto_id: string;
  nombre: string;
  codigo: string;
  stock_actual: number;
  stock_minimo: number;
  diferencia: number;
};

export type LoteDetalle = {
  lote_id: string;
  sku: string;
  cantidad_actual: number;
  precio_unitario: string;
  fecha_ingreso: string;
};
