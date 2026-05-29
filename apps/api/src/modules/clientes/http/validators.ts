import { TipoDocumento } from "@kallpasoft/shared";
import {
  createClienteDireccionSchema,
  updateClienteDireccionSchema,
  updateClienteSchema,
} from "@kallpasoft/validators";
import { z } from "zod";

export const listClientesQuerySchema = z.object({
  search: z.string().optional(),
  tipo_documento: z.nativeEnum(TipoDocumento).optional(),
  tipo_persona: z.enum(["NATURAL", "JURIDICA"] as const).optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListClientesQuery = z.infer<typeof listClientesQuerySchema>;

export const buscarDocumentoQuerySchema = z.object({
  tipo: z.nativeEnum(TipoDocumento),
  numero: z.string().min(1),
});
export type BuscarDocumentoQuery = z.infer<typeof buscarDocumentoQuerySchema>;

export const updateClienteHttpSchema = updateClienteSchema;
export type UpdateClienteHttpInput = z.infer<typeof updateClienteHttpSchema>;

export const createClienteDireccionHttpSchema = createClienteDireccionSchema.omit({
  cliente_id: true,
});
export type CreateClienteDireccionHttpInput = z.infer<typeof createClienteDireccionHttpSchema>;

export { updateClienteDireccionSchema };
export type UpdateClienteDireccionHttpInput = z.infer<typeof updateClienteDireccionSchema>;
