export type Caja = {
  id: string;
  tenant_id: string;
  sucursal_id: string;
  usuario_id: string;
  monto_apertura: string;
  monto_cierre: string | null;
  fecha_apertura: Date;
  fecha_cierre: Date | null;
  estado: string;
  notas_cierre: string | null;
  created_at: Date;
  updated_at: Date;
  sucursal_nombre?: string | undefined;
  usuario_nombre?: string | undefined;
};

export type ResumenCaja = {
  caja_id: string;
  total_ventas: number;
  cantidad_ventas: number;
  total_por_metodo: Array<{ metodo: string; total: number }>;
  diferencia: number;
};
