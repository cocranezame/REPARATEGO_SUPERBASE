import { TipoMovimiento, TipoProducto } from "@kallpasoft/shared";
import {
  createLoteSchema,
  createMovimientoSchema,
  createProductoSchema,
  syncCompatibilidadesSchema,
  updateProductoSchema,
} from "@kallpasoft/validators";
import { z } from "zod";

export const listProductosQuerySchema = z.object({
  tipo: z.nativeEnum(TipoProducto).optional(),
  categoria_id: z.string().optional(),
  componente_id: z.string().optional(),
  marca_id: z.string().optional(),
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
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
  syncCompatibilidadesSchema,
};

export const listStockQuerySchema = z.object({
  producto_id: z.string().uuid().optional(),
  sucursal_id: z.string().uuid().optional(),
  alerta_minimo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListStockQuery = z.infer<typeof listStockQuerySchema>;

export const listLotesQuerySchema = z.object({
  producto_id: z.string().uuid().optional(),
  sucursal_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLotesQuery = z.infer<typeof listLotesQuerySchema>;

export const listMovimientosQuerySchema = z.object({
  producto_id: z.string().uuid().optional(),
  tipo: z.nativeEnum(TipoMovimiento).optional(),
  sucursal_id: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMovimientosQuery = z.infer<typeof listMovimientosQuerySchema>;
