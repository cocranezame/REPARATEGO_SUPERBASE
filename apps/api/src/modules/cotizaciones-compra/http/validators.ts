import { cotizarCotizacionSchema, createCotizacionCompraSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listCotizacionesQuerySchema = z.object({
  proveedor_id: z.string().uuid().optional(),
  estado: z.enum(["PENDIENTE", "COTIZADA", "VENCIDA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCotizacionesQuery = z.infer<typeof listCotizacionesQuerySchema>;

export { cotizarCotizacionSchema, createCotizacionCompraSchema };
export type CreateCotizacionCompraHttpInput = z.infer<typeof createCotizacionCompraSchema>;
export type CotizarCotizacionHttpInput = z.infer<typeof cotizarCotizacionSchema>;
