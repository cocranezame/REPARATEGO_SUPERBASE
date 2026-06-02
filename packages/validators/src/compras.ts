import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── Solicitudes de compra ────────────────────────────────────────────────────

export const createSolicitudCompraSchema = z.object({
  producto_id: uuidSchema,
  cantidad_solicitada: z.number().int().min(1),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
  notas: z.string().optional(),
});
export type CreateSolicitudCompraInput = z.infer<typeof createSolicitudCompraSchema>;

export const updateSolicitudCompraSchema = z.object({
  cantidad_solicitada: z.number().int().min(1).optional(),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
  notas: z.string().optional(),
});
export type UpdateSolicitudCompraInput = z.infer<typeof updateSolicitudCompraSchema>;

// ─── Órdenes de compra ────────────────────────────────────────────────────────

export const generarOrdenCompraItemSchema = z.object({
  producto_id: uuidSchema,
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().positive(),
});
export type GenerarOrdenCompraItemInput = z.infer<typeof generarOrdenCompraItemSchema>;

export const generarOrdenCompraSchema = z.object({
  proveedor_id: uuidSchema,
  solicitud_ids: z.array(uuidSchema).min(1),
  items: z.array(generarOrdenCompraItemSchema).min(1),
  fecha_entrega_estimada: z.string().optional(),
  notas: z.string().optional(),
});
export type GenerarOrdenCompraInput = z.infer<typeof generarOrdenCompraSchema>;

export const updateEstadoOrdenCompraSchema = z.object({
  estado: z.enum(["GENERADA", "ENVIADA", "TERMINADA", "INGRESADA", "PENDIENTE_PAGO"]),
});
export type UpdateEstadoOrdenCompraInput = z.infer<typeof updateEstadoOrdenCompraSchema>;

export const confirmarOrdenItemSchema = z.object({
  producto_id: uuidSchema,
  cantidad_recibida: z.number().int().min(0),
  precio_unitario: z.number().positive(),
  conforme: z.boolean(),
  notas: z.string().optional(),
});
export type ConfirmarOrdenItemInput = z.infer<typeof confirmarOrdenItemSchema>;

export const confirmarOrdenCompraSchema = z.object({
  items: z.array(confirmarOrdenItemSchema).min(1),
});
export type ConfirmarOrdenCompraInput = z.infer<typeof confirmarOrdenCompraSchema>;

// ─── Pagos a proveedores ──────────────────────────────────────────────────────

export const createPagoProveedorSchema = z.object({
  orden_compra_id: uuidSchema,
  monto: z.number().positive(),
  metodo_pago: z.enum(["TRANSFERENCIA", "EFECTIVO", "CHEQUE"]),
  referencia: z.string().max(100).optional(),
  comprobante_url: z.string().max(500).optional(),
  fecha_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notas: z.string().optional(),
});
export type CreatePagoProveedorInput = z.infer<typeof createPagoProveedorSchema>;

export const listPagosProveedorQuerySchema = z.object({
  proveedor_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListPagosProveedorQuery = z.infer<typeof listPagosProveedorQuerySchema>;

// ─── Cotizaciones de compra ───────────────────────────────────────────────────

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
