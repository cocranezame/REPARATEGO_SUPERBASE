export type EstadoCaja = "ABIERTA" | "CERRADA";

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
  sucursal_nombre?: string | undefined;
  usuario_nombre?: string | undefined;
};

export type ResumenCaja = {
  caja: Caja;
  total_ventas: number;
  cantidad_ventas: number;
  total_por_metodo: Array<{ metodo: string; total: number }>;
};
