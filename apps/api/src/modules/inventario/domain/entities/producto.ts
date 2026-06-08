import type { AlcanceRepuesto, TipoProducto } from "@kallpasoft/shared";

export type Producto = {
  id: string;
  tenant_id: string;
  codigo: string;
  tipo: TipoProducto;
  alcance: AlcanceRepuesto | null;
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
  created_at: Date;
  updated_at: Date;
};
