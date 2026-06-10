import { createTipoRepuestoSchema, uuidSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listTiposRepuestoQuerySchema = z.object({
  componente_id: uuidSchema.optional(),
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(50),
});
export type ListTiposRepuestoQuery = z.infer<typeof listTiposRepuestoQuerySchema>;

export const updateTipoRepuestoHttpSchema = createTipoRepuestoSchema.partial();
export type UpdateTipoRepuestoHttpInput = z.infer<typeof updateTipoRepuestoHttpSchema>;
