import type { CreateProductoInput } from "@kallpasoft/validators";
import type { Producto } from "../entities/producto.js";
import type { CreateProductoData, IProductoRepository } from "../ports/producto.repository.js";

export async function createProducto(
  repo: IProductoRepository,
  tenantId: string,
  input: CreateProductoInput
): Promise<Producto> {
  const data: CreateProductoData = {
    tipo: input.tipo,
    nombre: input.nombre,
    categoria_id: input.categoria_id,
    precio_venta: input.precio_venta,
    ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
    ...(input.componente_id !== undefined ? { componente_id: input.componente_id } : {}),
    ...(input.marca_id !== undefined ? { marca_id: input.marca_id } : {}),
    ...(input.unidad_medida !== undefined ? { unidad_medida: input.unidad_medida } : {}),
    ...(input.precio_compra !== undefined ? { precio_compra: input.precio_compra } : {}),
    ...(input.stock_minimo !== undefined ? { stock_minimo: input.stock_minimo } : {}),
    ...(input.imagen_url !== undefined ? { imagen_url: input.imagen_url } : {}),
  };
  return repo.create(tenantId, data);
}
