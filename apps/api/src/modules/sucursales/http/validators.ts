import { createSucursalSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listSucursalesQuerySchema = z.object({
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListSucursalesQuery = z.infer<typeof listSucursalesQuerySchema>;

export const updateSucursalHttpSchema = createSucursalSchema.partial();
export type UpdateSucursalHttpInput = z.infer<typeof updateSucursalHttpSchema>;
