export type CotizacionVenta = {
  id: string;
  tenant_id: string;
  codigo: string;
  cliente_id: string | null;
  subtotal: string;
  igv: string;
  total: string;
  estado: string;
  fecha_vencimiento: string | null;
  usuario_id: string;
  notas: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  usuario_nombre?: string | undefined;
  cliente_nombre?: string | undefined;
};

export type CotizacionVentaItem = {
  id: string;
  tenant_id: string;
  cotizacion_venta_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  created_at: Date;
};

export type CotizacionVentaDetalle = CotizacionVenta & {
  items: CotizacionVentaItem[];
};
