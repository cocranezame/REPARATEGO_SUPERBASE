export type DashboardProductoAlerta = {
  producto_id: string;
  nombre: string;
  codigo: string;
  stock_actual: number;
  stock_minimo: number;
};

export type DashboardInventario = {
  total_productos: number;
  total_servicios: number;
  productos_stock_bajo_minimo: DashboardProductoAlerta[];
  cotizaciones_pendientes: number;
  valor_total_inventario: string;
};
