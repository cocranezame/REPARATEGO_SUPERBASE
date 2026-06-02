export type Lote = {
  id: string;
  tenant_id: string;
  producto_id: string;
  producto_nombre?: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  orden_compra_id: string | null;
  sku: string;
  correlativo: number;
  cantidad_inicial: number;
  cantidad_actual: number;
  precio_unitario: string;
  fecha_ingreso: string;
  fecha_vencimiento: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
