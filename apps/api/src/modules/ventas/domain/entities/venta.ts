export type EstadoVenta = "PENDIENTE" | "PAGADA" | "PARCIAL" | "ANULADA";

export type Venta = {
  id: string;
  tenant_id: string;
  codigo: string;
  caja_id: string;
  sucursal_id: string;
  cliente_id: string | null;
  tipo_venta: string;
  orden_servicio_id: string | null;
  visita_domicilio_id: string | null;
  subtotal: string;
  descuento: string;
  igv: string;
  total: string;
  estado: EstadoVenta;
  tipo_comprobante: string | null;
  serie_comprobante: string | null;
  numero_comprobante: string | null;
  usuario_id: string;
  notas: string | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
  cliente_nombre?: string | undefined;
  usuario_nombre?: string | undefined;
};

export type VentaItem = {
  id: string;
  tenant_id: string;
  venta_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  descuento: string;
  subtotal: string;
  created_at: Date;
};

export type VentaPago = {
  id: string;
  tenant_id: string;
  venta_id: string;
  metodo_pago_id: string;
  monto: string;
  referencia: string | null;
  fecha_pago: Date;
  created_at: Date;
  metodo_nombre?: string | undefined;
};

export type VentaEnvio = {
  id: string;
  tenant_id: string;
  venta_id: string;
  direccion_id: string | null;
  direccion_texto: string;
  estado: string;
  fecha_envio: Date | null;
  fecha_entrega: Date | null;
  costo_envio: string;
  notas: string | null;
  created_at: Date;
  updated_at: Date;
};

export type VentaDetalle = Venta & {
  items: VentaItem[];
  pagos: VentaPago[];
  envio: VentaEnvio | null;
};
