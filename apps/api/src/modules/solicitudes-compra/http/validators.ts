import { createSolicitudCompraSchema, updateSolicitudCompraSchema } from "@kallpasoft/validators";
import { z } from "zod";

export const listSolicitudesQuerySchema = z.object({
  estado: z.enum(["PENDIENTE", "EN_OC", "COMPLETADA"]).optional(),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListSolicitudesQuery = z.infer<typeof listSolicitudesQuerySchema>;

export { createSolicitudCompraSchema, updateSolicitudCompraSchema };
export type CreateSolicitudHttpInput = z.infer<typeof createSolicitudCompraSchema>;
export type UpdateSolicitudHttpInput = z.infer<typeof updateSolicitudCompraSchema>;
