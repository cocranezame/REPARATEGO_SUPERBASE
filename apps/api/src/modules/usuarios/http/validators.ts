import { RolUsuario } from "@kallpasoft/shared";
import { createUsuarioSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listUsuariosQuerySchema = z.object({
  search: z.string().optional(),
  rol: z.nativeEnum(RolUsuario).optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsuariosQuery = z.infer<typeof listUsuariosQuerySchema>;

// Update allows all fields including optional password for rehashing
export const updateUsuarioHttpSchema = createUsuarioSchema.partial();
export type UpdateUsuarioHttpInput = z.infer<typeof updateUsuarioHttpSchema>;
