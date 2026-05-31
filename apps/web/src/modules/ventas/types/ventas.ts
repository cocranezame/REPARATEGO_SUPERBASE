export type CajaDto = {
  id: string;
  tenant_id: string;
  sucursal_id: string;
  usuario_id: string;
  monto_apertura: string;
  monto_cierre: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  estado: string;
  notas_cierre: string | null;
  created_at: string;
  updated_at: string;
  sucursal_nombre?: string;
  usuario_nombre?: string;
};

export type ResumenCajaDto = {
  caja_id: string;
  total_ventas: number;
  cantidad_ventas: number;
  total_por_metodo: Array<{ metodo: string; total: number }>;
  diferencia: number;
};

export type CajasListResponse = {
  success: boolean;
  data: CajaDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CajaResponse = { success: boolean; data: CajaDto | null };
export type ResumenCajaResponse = { success: boolean; data: ResumenCajaDto };

export type VentaItemDto = {
  id: string;
  venta_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  descuento: string;
  subtotal: string;
  created_at: string;
};

export type VentaPagoDto = {
  id: string;
  venta_id: string;
  metodo_pago_id: string;
  monto: string;
  referencia: string | null;
  fecha_pago: string;
  metodo_nombre?: string;
};

export type VentaEnvioDto = {
  id: string;
  venta_id: string;
  direccion_id: string | null;
  direccion_texto: string;
  estado: string;
  fecha_envio: string | null;
  fecha_entrega: string | null;
  costo_envio: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

export type VentaDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  caja_id: string;
  sucursal_id: string;
  cliente_id: string | null;
  tipo_venta: string;
  orden_servicio_id: string | null;
  subtotal: string;
  descuento: string;
  igv: string;
  total: string;
  estado: string;
  tipo_comprobante: string | null;
  usuario_id: string;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  cliente_nombre?: string;
  usuario_nombre?: string;
};

export type VentaDetalleDto = VentaDto & {
  items: VentaItemDto[];
  pagos: VentaPagoDto[];
  envio: VentaEnvioDto | null;
};

export type VentasListResponse = {
  success: boolean;
  data: VentaDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type VentaResponse = { success: boolean; data: VentaDto };
export type VentaDetalleResponse = { success: boolean; data: VentaDetalleDto };
export type VentaPagoResponse = { success: boolean; data: VentaPagoDto };
export type VentasEnvioListResponse = {
  success: boolean;
  data: VentaEnvioDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CotizacionVentaItemDto = {
  id: string;
  cotizacion_venta_id: string;
  producto_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
};

export type CotizacionVentaDto = {
  id: string;
  codigo: string;
  cliente_id: string | null;
  subtotal: string;
  igv: string;
  total: string;
  estado: string;
  fecha_vencimiento: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  usuario_nombre?: string;
  cliente_nombre?: string;
};

export type CotizacionVentaDetalleDto = CotizacionVentaDto & {
  items: CotizacionVentaItemDto[];
};

export type CotizacionesVentaListResponse = {
  success: boolean;
  data: CotizacionVentaDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type CotizacionVentaResponse = { success: boolean; data: CotizacionVentaDetalleDto };

export type VentasParams = {
  tipo_venta?: string;
  estado?: string;
  caja_id?: string;
  cliente_id?: string;
  desde?: string;
  hasta?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type CotizacionesVentaParams = {
  cliente_id?: string;
  estado?: string;
  page?: number;
  pageSize?: number;
};
