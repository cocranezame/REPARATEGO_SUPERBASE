// Types for ventas module — C003

// ─── Caja ─────────────────────────────────────────────────────────────────────

export type CajaDto = {
  id: string;
  tenant_id: string;
  sucursal_id: string;
  usuario_id: string;
  monto_inicial: string;
  monto_esperado: string | null;
  monto_fisico: string | null;
  diferencia: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  estado: "ABIERTA" | "CERRADA";
  created_at: string;
  updated_at: string;
  sucursal_nombre?: string | undefined;
  usuario_nombre?: string | undefined;
};

export type ResumenCajaDto = {
  caja: CajaDto;
  total_ventas: number;
  cantidad_ventas: number;
  total_por_metodo: Array<{ metodo: string; total: number }>;
};

export type CajaResponse = { success: boolean; data: CajaDto | null };
export type ResumenCajaResponse = { success: boolean; data: ResumenCajaDto };

// ─── Venta items ──────────────────────────────────────────────────────────────

export type VentaItemDto = {
  id: string;
  venta_id: string;
  tipo_item: "PRODUCTO" | "SERVICIO" | "ENVIO" | "MANUAL";
  produto_id: string | null; // DB column typo preserved
  lote_id: string | null;
  sku: string | null;
  numero_serie: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  es_preventivo: boolean;
  created_at: string;
};

// ─── Pagos ────────────────────────────────────────────────────────────────────

export type VentaPagoDto = {
  id: string;
  venta_id: string;
  metodo_pago_id: string;
  caja_id: string | null;
  monto: string;
  referencia: string | null;
  fecha_pago: string;
  created_by: string | null;
  created_at: string;
  metodo_nombre?: string | undefined;
  usuario_nombre?: string | undefined;
};

// ─── Envío ────────────────────────────────────────────────────────────────────

export type VentaEnvioDto = {
  id: string;
  venta_id: string;
  direccion_id: string | null;
  direccion_texto: string | null;
  metodo_envio: string | null;
  fecha_programada: string | null;
  costo_envio: string;
  estado: "PENDIENTE" | "DESPACHADO";
  created_at: string;
  updated_at: string;
};

// ─── Venta ────────────────────────────────────────────────────────────────────

export type VentaDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  caja_id: string;
  sucursal_id: string;
  cliente_id: string | null;
  tipo_venta: "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION";
  orden_servicio_id: string | null;
  visita_domicilio_id: string | null;
  total: string;
  estado_pago: "PAGO_PENDIENTE" | "COMPLETADA" | "ANULADA";
  estado_despacho: "SIN_ENVIO" | "ENVIO_PENDIENTE" | "DESPACHADO";
  motivo_anulacion: string | null;
  nota_credito_monto: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  cliente_nombre?: string | undefined;
  vendedor_nombre?: string | undefined;
};

export type VentaDetalleDto = VentaDto & {
  items: VentaItemDto[];
  pagos: VentaPagoDto[];
  envio: VentaEnvioDto | null;
  saldo_pendiente: string;
  porcentaje_pagado: number;
  servicio_asociado?: { id: string; estado: string } | undefined;
};

export type VentasListResponse = {
  success: boolean;
  data: VentaDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type VentaResponse = { success: boolean; data: VentaDto };
export type VentaDetalleResponse = { success: boolean; data: VentaDetalleDto };

export type AddPagoResponse = {
  success: boolean;
  data: VentaPagoDto;
};

export type AnularVentaRespDto = VentaDto & { stock_revertido: boolean };
export type AnularVentaResponse = { success: boolean; data: AnularVentaRespDto };

// ─── Envíos calendario ────────────────────────────────────────────────────────

export type EnvioCalendarioDto = {
  venta_id: string;
  venta_codigo: string;
  cliente_nombre?: string | undefined;
  direccion_texto: string | null;
  fecha_programada: string | null;
  metodo_envio: string | null;
  estado: "PENDIENTE" | "DESPACHADO";
};

export type CalendarioEnviosResponse = {
  success: boolean;
  data: EnvioCalendarioDto[];
};

// ─── Cotizaciones referenciales ───────────────────────────────────────────────

export type CotizacionVentaItemDto = {
  id: string;
  cotizacion_venta_id: string;
  produto_id: string | null; // DB column typo preserved
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
};

export type CotizacionVentaDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  caja_id: string | null;
  cliente_id: string | null;
  total_referencial: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  cliente_nombre?: string | undefined;
  usuario_nombre?: string | undefined;
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

// ─── Query params ─────────────────────────────────────────────────────────────

export type VentasParams = {
  estado_pago?: string | undefined;
  estado_despacho?: string | undefined;
  tipo?: string | undefined;
  caja_id?: string | undefined;
  cliente_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};

export type CotizacionesVentaParams = {
  cliente_id?: string | undefined;
  fecha_desde?: string | undefined;
  fecha_hasta?: string | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
};
