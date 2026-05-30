export type ProductoDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  tipo: "PRODUCTO" | "SERVICIO";
  nombre: string;
  descripcion: string | null;
  categoria_id: string;
  componente_id: string | null;
  marca_id: string | null;
  unidad_medida: string;
  precio_compra: string | null;
  precio_venta: string;
  stock_minimo: number;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  compatibilidades?: ProductoCompatibilidadDto[];
};

export type ProductoCompatibilidadDto = {
  id: string;
  tenant_id: string;
  producto_id: string;
  modelo_id: string;
  created_at: string;
};

export type TasaPrecioDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  porcentaje: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type MetodoPagoDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductosListResponse = {
  success: true;
  data: ProductoDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type ProductoResponse = {
  success: true;
  data: ProductoDto;
};

export type CompatibilidadesListResponse = {
  success: true;
  data: ProductoCompatibilidadDto[];
};

export type TasasPrecioListResponse = {
  success: true;
  data: TasaPrecioDto[];
};

export type TasaPrecioResponse = {
  success: true;
  data: TasaPrecioDto;
};

export type MetodosPagoListResponse = {
  success: true;
  data: MetodoPagoDto[];
};

export type MetodoPagoResponse = {
  success: true;
  data: MetodoPagoDto;
};

export type ProductosParams = {
  tipo?: "PRODUCTO" | "SERVICIO";
  categoria_id?: string;
  componente_id?: string;
  marca_id?: string;
  search?: string;
  activo?: boolean;
  page?: number;
  pageSize?: number;
};

// ─── Stock ────────────────────────────────────────────────────────────────────

export type StockItemDto = {
  producto_id: string;
  nombre: string;
  codigo: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  stock_actual: number;
  stock_minimo: number;
  en_alerta: boolean;
};

export type LoteDetalleDto = {
  lote_id: string;
  sku: string;
  cantidad_actual: number;
  precio_unitario: string;
  fecha_ingreso: string;
};

export type StockListResponse = {
  success: true;
  data: StockItemDto[];
};

export type StockDetalleResponse = {
  success: true;
  data: LoteDetalleDto[];
};

// ─── Lotes ────────────────────────────────────────────────────────────────────

export type LoteDto = {
  id: string;
  tenant_id: string;
  producto_id: string;
  producto_nombre?: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  orden_compra_id: string | null;
  sku: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  precio_unitario: string;
  fecha_ingreso: string;
  fecha_vencimiento: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type LotesListResponse = {
  success: true;
  data: LoteDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type LoteResponse = {
  success: true;
  data: LoteDto;
};

export type LotesParams = {
  producto_id?: string;
  sucursal_id?: string;
  page?: number;
  pageSize?: number;
};

// ─── Movimientos ──────────────────────────────────────────────────────────────

export type TipoMovimiento =
  | "INGRESO"
  | "VENTA"
  | "SERVICIO"
  | "MERMA"
  | "REAJUSTE"
  | "TRANSFERENCIA";

export type MovimientoDto = {
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
  created_at: string;
};

export type MovimientosListResponse = {
  success: true;
  data: MovimientoDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type MovimientoResponse = {
  success: true;
  data: MovimientoDto;
};

export type MovimientosParams = {
  producto_id?: string;
  tipo?: TipoMovimiento;
  sucursal_id?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
};
