import type { AlcanceRepuesto, TipoProducto } from "@kallpasoft/shared";
import type { Producto } from "../entities/producto.js";
import type { ProductoCompatibilidad } from "../entities/producto-compatibilidad.js";

export type CreateProductoData = {
  tipo: TipoProducto;
  alcance?: AlcanceRepuesto;
  nombre: string;
  descripcion?: string;
  categoria_id: string;
  componente_id?: string;
  marca_id?: string;
  unidad_medida?: string;
  // precio_compra: set by ingreso movements (from cotización linked to ingreso)
  // precio_venta: set by Tasas % system (calculated from ultimo_costo + tasa)
  stock_minimo?: number;
  imagen_url?: string;
};

export type UpdateProductoData = {
  alcance?: AlcanceRepuesto | null;
  nombre?: string;
  descripcion?: string | null;
  categoria_id?: string;
  componente_id?: string | null;
  marca_id?: string | null;
  unidad_medida?: string;
  // precio_compra: updated by ingreso movements, not from product form
  // precio_venta: updated by Tasas % system, not from product form
  // Internal-only update path (e.g. ingreso service):
  _precio_compra?: number | null;
  _precio_venta?: number;
  stock_minimo?: number;
  imagen_url?: string | null;
  activo?: boolean;
};

export type ListProductosParams = {
  tipo?: TipoProducto;
  categoria_id?: string;
  componente_id?: string;
  marca_id?: string;
  search?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListProductosResult = {
  items: Producto[];
  total: number;
};

export interface IProductoRepository {
  findById(tenantId: string, id: string): Promise<Producto | null>;
  list(tenantId: string, params: ListProductosParams): Promise<ListProductosResult>;
  create(tenantId: string, data: CreateProductoData): Promise<Producto>;
  update(tenantId: string, id: string, data: UpdateProductoData): Promise<Producto | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
  listCompatibilidades(tenantId: string, productoId: string): Promise<ProductoCompatibilidad[]>;
  syncCompatibilidades(
    tenantId: string,
    productoId: string,
    modeloIds: string[]
  ): Promise<ProductoCompatibilidad[]>;
}
