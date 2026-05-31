import { z } from "zod";

export const listVentasQuerySchema = z.object({
  tipo_venta: z.enum(["LIBRE", "SERVICIO", "REVISION_DOMICILIO", "REVISION_DEVOLUCION"]).optional(),
  estado: z.enum(["PENDIENTE", "PAGADA", "PARCIAL", "ANULADA"]).optional(),
  caja_id: z.string().uuid().optional(),
  cliente_id: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListVentasQueryLocal = z.infer<typeof listVentasQuerySchema>;

export const listEnviosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListEnviosQuery = z.infer<typeof listEnviosQuerySchema>;
