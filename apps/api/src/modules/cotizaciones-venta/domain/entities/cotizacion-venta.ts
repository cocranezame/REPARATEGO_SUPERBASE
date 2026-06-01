export type CotizacionVenta = {
  id: string;
  tenant_id: string;
  codigo: string;
  cliente_id: string | null;
  caja_id: string | null;
  total_referencial: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  cliente_nombre?: string | undefined;
  created_by_nombre?: string | undefined;
};

export type CotizacionVentaItem = {
  id: string;
  tenant_id: string;
  cotizacion_venta_id: string;
  produto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  created_at: Date;
};

export type CotizacionVentaDetalle = CotizacionVenta & {
  items: CotizacionVentaItem[];
};
