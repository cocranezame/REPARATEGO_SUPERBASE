import { createComponenteSchema, uuidSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listComponentesQuerySchema = z.object({
  categoria_id: uuidSchema.optional(),
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListComponentesQuery = z.infer<typeof listComponentesQuerySchema>;

export const updateComponenteHttpSchema = createComponenteSchema.partial();
export type UpdateComponenteHttpInput = z.infer<typeof updateComponenteHttpSchema>;
