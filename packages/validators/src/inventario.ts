import { TipoProducto } from "@kallpasoft/shared";
import { z } from "zod";
import { uuidSchema } from "./common.js";

export const createProductoSchema = z.object({
  tipo: z.nativeEnum(TipoProducto),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  categoria_id: uuidSchema,
  componente_id: uuidSchema.optional(),
  marca_id: uuidSchema.optional(),
  unidad_medida: z.string().max(10).optional(),
  precio_compra: z.number().positive().optional(),
  precio_venta: z.number().positive(),
  stock_minimo: z.number().int().min(0).optional(),
  imagen_url: z.string().url().optional(),
});
export type CreateProductoInput = z.infer<typeof createProductoSchema>;

export const updateProductoSchema = createProductoSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;

export const syncCompatibilidadesSchema = z.object({
  modelo_ids: z.array(uuidSchema),
});
export type SyncCompatibilidadesInput = z.infer<typeof syncCompatibilidadesSchema>;

export const createTasaPrecioSchema = z.object({
  nombre: z.string().min(1).max(50),
  porcentaje: z.number().min(0).max(999.99),
});
export type CreateTasaPrecioInput = z.infer<typeof createTasaPrecioSchema>;

export const updateTasaPrecioSchema = createTasaPrecioSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateTasaPrecioInput = z.infer<typeof updateTasaPrecioSchema>;

export const createMetodoPagoSchema = z.object({
  nombre: z.string().min(1).max(50),
});
export type CreateMetodoPagoInput = z.infer<typeof createMetodoPagoSchema>;

export const updateMetodoPagoSchema = createMetodoPagoSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateMetodoPagoInput = z.infer<typeof updateMetodoPagoSchema>;
