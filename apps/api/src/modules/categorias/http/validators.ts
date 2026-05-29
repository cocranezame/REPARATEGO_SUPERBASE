import { createCategoriaSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listCategoriasQuerySchema = z.object({
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  padre_id: z.string().optional(),
  incluir_hijos: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCategoriasQuery = z.infer<typeof listCategoriasQuerySchema>;

export const updateCategoriaHttpSchema = createCategoriaSchema.partial();
export type UpdateCategoriaHttpInput = z.infer<typeof updateCategoriaHttpSchema>;
