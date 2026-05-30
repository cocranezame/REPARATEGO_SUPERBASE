export type EstadoCotizacionCompra = "PENDIENTE" | "COTIZADA" | "VENCIDA";

export type CotizacionCompraDetalle = {
  id: string;
  tenant_id: string;
  cotizacion_compra_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: string | null;
  subtotal: string | null;
  notas: string | null;
  created_at: Date;
};

export type CotizacionCompra = {
  id: string;
  tenant_id: string;
  codigo: string;
  proveedor_id: string;
  proveedor_nombre?: string;
  estado: EstadoCotizacionCompra;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  usuario_id: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  detalles?: CotizacionCompraDetalle[];
};
