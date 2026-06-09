import { TipoMovimiento, TipoProducto } from "@kallpasoft/shared";
import {
  createLoteSchema,
  createMovimientoSchema,
  createProductoSchema,
  syncCategoriasProductoSchema,
  syncCompatibilidadesSchema,
  updateProductoSchema,
  uuidSchema,
} from "@kallpasoft/validators";
import { z } from "zod";

const boolFlag = z
  .union([z.literal("true"), z.literal("false")])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === "true"));

export const listProductosQuerySchema = z.object({
  tipo: z.nativeEnum(TipoProducto).optional(),
  categoria_id: z.string().optional(),
  componente_id: z.string().optional(),
  marca_id: z.string().optional(),
  modelo_id: z.string().optional(),
  search: z.string().optional(),
  activo: boolFlag,
  con_imagen: boolFlag,
  sin_cotizacion: boolFlag,
  sin_tasa: boolFlag,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListProductosQuery = z.infer<typeof listProductosQuerySchema>;

export const listSimpleQuerySchema = z.object({
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListSimpleQuery = z.infer<typeof listSimpleQuerySchema>;

export const updateProductoHttpSchema = updateProductoSchema;
export type UpdateProductoHttpInput = z.infer<typeof updateProductoHttpSchema>;

export {
  createLoteSchema,
  createMovimientoSchema,
  createProductoSchema,
  syncCategoriasProductoSchema,
  syncCompatibilidadesSchema,
};

export const listStockQuerySchema = z.object({
  producto_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
  alerta_minimo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListStockQuery = z.infer<typeof listStockQuerySchema>;

export const listLotesQuerySchema = z.object({
  producto_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLotesQuery = z.infer<typeof listLotesQuerySchema>;

export const listMovimientosQuerySchema = z.object({
  producto_id: uuidSchema.optional(),
  tipo: z.nativeEnum(TipoMovimiento).optional(),
  sucursal_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMovimientosQuery = z.infer<typeof listMovimientosQuerySchema>;
