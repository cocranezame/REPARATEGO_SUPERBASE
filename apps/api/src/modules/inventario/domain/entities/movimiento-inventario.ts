export type TipoMovimiento =
  | "INGRESO"
  | "VENTA"
  | "SERVICIO"
  | "MERMA"
  | "REAJUSTE"
  | "TRANSFERENCIA";

export type MovimientoInventario = {
  id: string;
  tenant_id: string;
  producto_id: string;
  producto_nombre?: string;
  lote_id: string | null;
  sucursal_id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  notas: string | null;
  usuario_id: string;
  created_at: Date;
};
