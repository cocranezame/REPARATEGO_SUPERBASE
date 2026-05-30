import { TipoProducto } from "@kallpasoft/shared";
import {
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

export { createProductoSchema, syncCompatibilidadesSchema };
