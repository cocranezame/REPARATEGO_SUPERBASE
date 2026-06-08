import {
  createCotizacionCompraSchema,
  updateCotizacionCompraSchema,
  uuidSchema,
} from "@kallpasoft/validators";
import { z } from "zod";

export const listCotizacionesQuerySchema = z.object({
  proveedor_id: uuidSchema.optional(),
  producto_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCotizacionesQuery = z.infer<typeof listCotizacionesQuerySchema>;

export { createCotizacionCompraSchema, updateCotizacionCompraSchema };
export type CreateCotizacionCompraHttpInput = z.infer<typeof createCotizacionCompraSchema>;
export type UpdateCotizacionCompraHttpInput = z.infer<typeof updateCotizacionCompraSchema>;
