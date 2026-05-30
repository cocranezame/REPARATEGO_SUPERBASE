import {
  confirmarOrdenCompraSchema,
  generarOrdenCompraSchema,
  updateEstadoOrdenCompraSchema,
} from "@kallpasoft/validators";
import { z } from "zod";

export const listOrdenesQuerySchema = z.object({
  estado: z.enum(["GENERADA", "ENVIADA", "TERMINADA", "INGRESADA", "PENDIENTE_PAGO"]).optional(),
  proveedor_id: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListOrdenesQuery = z.infer<typeof listOrdenesQuerySchema>;

export { confirmarOrdenCompraSchema, generarOrdenCompraSchema, updateEstadoOrdenCompraSchema };
export type GenerarOrdenHttpInput = z.infer<typeof generarOrdenCompraSchema>;
export type UpdateEstadoHttpInput = z.infer<typeof updateEstadoOrdenCompraSchema>;
export type ConfirmarOrdenHttpInput = z.infer<typeof confirmarOrdenCompraSchema>;
