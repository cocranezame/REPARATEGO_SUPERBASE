import type { PagoProveedor } from "../entities/pago-proveedor.js";

export type ListPagosParams = {
  page: number;
  pageSize: number;
  proveedor_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
};

export type ListPagosResult = {
  items: PagoProveedor[];
  total: number;
};

export type CreatePagoData = {
  orden_compra_id: string;
  monto: number;
  metodo_pago: "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE";
  referencia?: string | undefined;
  comprobante_url?: string | undefined;
  fecha_pago: string;
  notas?: string | undefined;
  usuario_id: string;
};

export interface IPagoProveedorRepository {
  list(tenantId: string, params: ListPagosParams): Promise<ListPagosResult>;
  create(tenantId: string, data: CreatePagoData): Promise<PagoProveedor>;
}
