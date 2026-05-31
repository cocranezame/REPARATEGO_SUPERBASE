import type { Venta, VentaDetalle, VentaEnvio, VentaPago } from "../entities/venta.js";

export type CreateVentaItemData = {
  producto_id?: string | undefined;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento?: number | undefined;
};

export type CreateVentaData = {
  caja_id: string;
  sucursal_id: string;
  usuario_id: string;
  cliente_id?: string | undefined;
  tipo_venta?: string | undefined;
  orden_servicio_id?: string | undefined;
  visita_domicilio_id?: string | undefined;
  items: CreateVentaItemData[];
  tipo_comprobante?: string | undefined;
  notas?: string | undefined;
};

export type AddVentaPagoData = {
  metodo_pago_id: string;
  monto: number;
  referencia?: string | undefined;
};

export type CreateVentaEnvioData = {
  direccion_id?: string | undefined;
  direccion_texto: string;
  costo_envio?: number | undefined;
  notas?: string | undefined;
};

export type ListVentasParams = {
  tipo_venta?: string | undefined;
  estado?: string | undefined;
  caja_id?: string | undefined;
  cliente_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  search?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListVentasResult = {
  items: Venta[];
  total: number;
};

export interface IVentaRepository {
  list(tenantId: string, params: ListVentasParams): Promise<ListVentasResult>;
  findById(tenantId: string, id: string): Promise<VentaDetalle | null>;
  create(tenantId: string, data: CreateVentaData): Promise<Venta>;
  anular(tenantId: string, id: string, motivo: string, usuarioId: string): Promise<Venta | null>;
  listPagos(tenantId: string, ventaId: string): Promise<VentaPago[]>;
  addPago(tenantId: string, ventaId: string, data: AddVentaPagoData): Promise<VentaPago>;
  getEnvio(tenantId: string, ventaId: string): Promise<VentaEnvio | null>;
  createEnvio(tenantId: string, ventaId: string, data: CreateVentaEnvioData): Promise<VentaEnvio>;
  updateEnvioEstado(tenantId: string, ventaId: string, estado: string): Promise<VentaEnvio | null>;
  listEnvios(
    tenantId: string,
    params: { page: number; pageSize: number }
  ): Promise<{ items: VentaEnvio[]; total: number }>;
}
