export type MetodoPagoProveedor = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE";

export type PagoDto = {
  id: string;
  tenant_id: string;
  orden_compra_id: string;
  orden_compra_codigo?: string;
  proveedor_id: string;
  proveedor_nombre?: string;
  monto: string;
  metodo_pago: MetodoPagoProveedor;
  referencia: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
  notas: string | null;
  usuario_id: string;
  created_at: string;
};

export type PagosParams = {
  proveedor_id?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
};

export type PagosListResponse = {
  success: boolean;
  data: PagoDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type PagoResponse = { success: boolean; data: PagoDto };
