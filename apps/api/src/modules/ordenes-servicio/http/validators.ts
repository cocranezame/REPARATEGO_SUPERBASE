import { z } from "zod";

const uuidSchema = z.string().uuid();

export const listOrdenesQuerySchema = z.object({
  estado: z
    .enum([
      "RECEPCION",
      "EN_DIAGNOSTICO",
      "DIAGNOSTICADO",
      "COTIZADO",
      "APROBADO",
      "EN_REPARACION",
      "REPARADO",
      "LISTO_ENTREGA",
      "ENTREGADO",
      "DEVOLUCION",
      "CANCELADO",
    ])
    .optional(),
  tecnico_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
  cliente_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListOrdenesQuery = z.infer<typeof listOrdenesQuerySchema>;
