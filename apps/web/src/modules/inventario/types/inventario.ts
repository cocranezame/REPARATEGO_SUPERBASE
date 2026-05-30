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
