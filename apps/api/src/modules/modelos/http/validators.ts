import { createModeloSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listModelosQuerySchema = z.object({
  marca_id: z.string().uuid().optional(),
  categoria_id: z.string().uuid().optional(),
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListModelosQuery = z.infer<typeof listModelosQuerySchema>;

export const updateModeloHttpSchema = createModeloSchema.partial();
export type UpdateModeloHttpInput = z.infer<typeof updateModeloHttpSchema>;
