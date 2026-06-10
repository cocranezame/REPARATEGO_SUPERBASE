import {
  createCondicionPagoSchema,
  createProveedorContactoSchema,
  createProveedorLineaSchema,
  createProveedorMetodoPagoSchema,
  createProveedorSchema,
  updateCondicionPagoSchema,
  updateProveedorContactoSchema,
  updateProveedorMetodoPagoSchema,
  updateProveedorSchema,
} from "@kallpasoft/validators";
import { z } from "zod";

export const listProveedoresQuerySchema = z.object({
  search: z.string().optional(),
  activo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListProveedoresQuery = z.infer<typeof listProveedoresQuerySchema>;

export { createCondicionPagoSchema, updateCondicionPagoSchema };
export type CreateCondicionPagoHttpInput = z.infer<typeof createCondicionPagoSchema>;
export type UpdateCondicionPagoHttpInput = z.infer<typeof updateCondicionPagoSchema>;

export { createProveedorSchema, updateProveedorSchema };
export type CreateProveedorHttpInput = z.infer<typeof createProveedorSchema>;
export type UpdateProveedorHttpInput = z.infer<typeof updateProveedorSchema>;

export { createProveedorContactoSchema, updateProveedorContactoSchema };
export type CreateProveedorContactoHttpInput = z.infer<typeof createProveedorContactoSchema>;
export type UpdateProveedorContactoHttpInput = z.infer<typeof updateProveedorContactoSchema>;

export { createProveedorMetodoPagoSchema, updateProveedorMetodoPagoSchema };
export type CreateProveedorMetodoPagoHttpInput = z.infer<typeof createProveedorMetodoPagoSchema>;
export type UpdateProveedorMetodoPagoHttpInput = z.infer<typeof updateProveedorMetodoPagoSchema>;

export { createProveedorLineaSchema };
export type CreateProveedorLineaHttpInput = z.infer<typeof createProveedorLineaSchema>;
