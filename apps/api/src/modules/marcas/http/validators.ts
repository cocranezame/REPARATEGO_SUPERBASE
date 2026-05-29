import { createMarcaSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listMarcasQuerySchema = z.object({
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMarcasQuery = z.infer<typeof listMarcasQuerySchema>;

export const updateMarcaHttpSchema = createMarcaSchema.partial();
export type UpdateMarcaHttpInput = z.infer<typeof updateMarcaHttpSchema>;
