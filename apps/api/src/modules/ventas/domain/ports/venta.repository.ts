import type { Venta, VentaDetalle, VentaEnvio, VentaPago } from "../entities/venta.js";

// ─── Crear venta ──────────────────────────────────────────────────────────────

export type CreateVentaItemData = {
  tipo_item: "PRODUTO" | "SERVICIO" | "ENVIO" | "MANUAL";
  produto_id?: string | undefined;
  lote_id?: string | undefined;
  sku?: string | undefined;
  numero_serie?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  es_preventivo?: boolean | undefined;
};

export type CreateVentaPagoData = {
  metodo_pago_id: string;
  monto: number;
};

export type CreateVentaEnvioData = {
  direccion_id?: string | undefined;
  metodo_envio?: string | undefined;
  fecha_programada?: string | undefined;
  costo_envio?: number | undefined;
};

export type CreateVentaData = {
  caja_id: string;
  tipo: "LIBRE" | "SERVICIO" | "REVISION_DOMICILIO" | "REVISION_DEVOLUCION";
  cliente_id?: string | undefined;
  orden_servicio_id?: string | undefined;
  visita_domicilio_id?: string | undefined;
  items: CreateVentaItemData[];
  pagos?: CreateVentaPagoData[] | undefined;
  requiere_envio?: boolean | undefined;
  datos_envio?: CreateVentaEnvioData | undefined;
  created_by: string;
};

// ─── Listar ventas ────────────────────────────────────────────────────────────

export type ListVentasParams = {
  tipo?: string | undefined;
  estado_pago?: string | undefined;
  estado_despacho?: string | undefined;
  caja_id?: string | undefined;
  cliente_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  created_by?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListVentasResult = {
  items: Venta[];
  total: number;
};

// ─── Pago ─────────────────────────────────────────────────────────────────────

export type AddVentaPagoData = {
  metodo_pago_id: string;
  monto: number;
  caja_id: string;
  created_by: string;
};

// ─── Anular ───────────────────────────────────────────────────────────────────

export type AnularVentaData = {
  motivo: string;
  anulado_por: string;
};

// ─── Envío ────────────────────────────────────────────────────────────────────

export type ActualizarEnvioData = {
  direccion_id?: string | undefined;
  metodo_envio?: string | undefined;
  fecha_programada?: string | undefined;
  costo_envio?: number | undefined;
};

export type ListEnviosCalendarioParams = {
  fecha_desde: string;
  fecha_hasta: string;
  sucursal_id?: string | undefined;
};

// ─── Cotizaciones ─────────────────────────────────────────────────────────────

export type CreateCotizacionItemData = {
  produto_id?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
};

// ─── Repository interface ─────────────────────────────────────────────────────

export interface IVentaRepository {
  // Ventas
  create(tenantId: string, data: CreateVentaData): Promise<Venta>;
  list(tenantId: string, params: ListVentasParams): Promise<ListVentasResult>;
  findById(tenantId: string, id: string): Promise<VentaDetalle | null>;

  // Pagos
  addPago(tenantId: string, ventaId: string, data: AddVentaPagoData): Promise<VentaPago>;

  // Anulación
  anular(tenantId: string, id: string, data: AnularVentaData): Promise<Venta | null>;

  // Envío
  actualizarEnvio(
    tenantId: string,
    ventaId: string,
    data: ActualizarEnvioData
  ): Promise<VentaEnvio>;
  despacharEnvio(tenantId: string, ventaId: string): Promise<VentaEnvio | null>;
  listEnviosCalendario(tenantId: string, params: ListEnviosCalendarioParams): Promise<VentaEnvio[]>;

  // Integración servicios (llamados internamente desde módulo servicios)
  crearVentaDesdeServicio(tenantId: string, data: CreateVentaData): Promise<Venta>;
  actualizarItemsConSkus(
    tenantId: string,
    ventaId: string,
    items: CreateVentaItemData[]
  ): Promise<void>;
}
