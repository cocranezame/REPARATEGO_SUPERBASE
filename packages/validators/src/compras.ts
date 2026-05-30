import { z } from "zod";
import { uuidSchema } from "./common.js";

export const createCotizacionCompraItemSchema = z.object({
  producto_id: uuidSchema,
  cantidad: z.number().int().min(1),
});
export type CreateCotizacionCompraItemInput = z.infer<typeof createCotizacionCompraItemSchema>;

export const createCotizacionCompraSchema = z.object({
  proveedor_id: uuidSchema,
  items: z.array(createCotizacionCompraItemSchema).min(1),
  fecha_vencimiento: z.string().optional(),
  notas: z.string().optional(),
});
export type CreateCotizacionCompraInput = z.infer<typeof createCotizacionCompraSchema>;

export const cotizarItemSchema = z.object({
  detalle_id: uuidSchema,
  precio_unitario: z.number().positive(),
});
export type CotizarItemInput = z.infer<typeof cotizarItemSchema>;

export const cotizarCotizacionSchema = z.object({
  items: z.array(cotizarItemSchema).min(1),
});
export type CotizarCotizacionInput = z.infer<typeof cotizarCotizacionSchema>;
