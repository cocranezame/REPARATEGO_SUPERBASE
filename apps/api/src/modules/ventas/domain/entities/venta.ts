export type EstadoCaja = "ABIERTA" | "CERRADA";
export type EstadoPagoVenta = "PAGO_PENDIENTE" | "COMPLETADA" | "ANULADA";
export type EstadoDespachoVenta = "SIN_ENVIO" | "ENVIO_PENDIENTE" | "DESPACHADO";
export type TipoItemVenta = "PRODUCTO" | "SERVICIO" | "ENVIO" | "MANUAL";
export type EstadoEnvioVenta = "PENDIENTE" | "DESPACHADO";

export type Caja = {
  id: string;
  tenant_id: string;
  sucursal_id: string;
  usuario_id: string;
  monto_inicial: string;
  monto_esperado: string | null;
  monto_fisico: string | null;
  diferencia: string | null;
  fecha_apertura: Date;
  fecha_cierre: Date | null;
  estado: EstadoCaja;
  created_at: Date;
  updated_at: Date;
};

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
  total: string;
  estado_pago: EstadoPagoVenta;
  estado_despacho: EstadoDespachoVenta;
  motivo_anulacion: string | null;
  anulado_por: string | null;
  nota_credito_monto: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  cliente_nombre?: string | undefined;
  vendedor_nombre?: string | undefined;
};

export type VentaItem = {
  id: string;
  tenant_id: string;
  venta_id: string;
  tipo_item: TipoItemVenta;
  produto_id: string | null; // DB column "produto_id" (nombre histórico)
  lote_id: string | null;
  sku: string | null;
  numero_serie: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  es_preventivo: boolean;
  created_at: Date;
};

export type VentaPago = {
  id: string;
  tenant_id: string;
  venta_id: string;
  metodo_pago_id: string;
  caja_id: string | null;
  monto: string;
  referencia: string | null;
  fecha_pago: Date;
  created_by: string | null;
  created_at: Date;
  metodo_nombre?: string | undefined;
};

export type VentaEnvio = {
  id: string;
  tenant_id: string;
  venta_id: string;
  direccion_id: string | null;
  direccion_texto: string | null;
  metodo_envio: string | null;
  fecha_programada: string | null;
  costo_envio: string;
  estado: EstadoEnvioVenta;
  created_at: Date;
  updated_at: Date;
};

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
};

export type CotizacionVentaItem = {
  id: string;
  tenant_id: string;
  cotizacion_venta_id: string;
  produto_id: string | null; // DB column "produto_id" (nombre histórico)
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  created_at: Date;
};

export type VentaDetalle = Venta & {
  items: VentaItem[];
  pagos: VentaPago[];
  envio: VentaEnvio | null;
  saldo_pendiente: string;
  porcentaje_pagado: number;
};
