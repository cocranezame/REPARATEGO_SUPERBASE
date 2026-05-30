export type MetodoPagoProveedor = "TRANSFERENCIA" | "EFECTIVO" | "CHEQUE";

export type PagoProveedor = {
  id: string;
  tenant_id: string;
  orden_compra_id: string;
  orden_compra_codigo?: string | undefined;
  proveedor_id: string;
  proveedor_nombre?: string | undefined;
  monto: string;
  metodo_pago: MetodoPagoProveedor;
  referencia: string | null;
  comprobante_url: string | null;
  fecha_pago: string;
  notas: string | null;
  usuario_id: string;
  created_at: Date;
};
