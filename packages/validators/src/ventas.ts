import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── Caja ─────────────────────────────────────────────────────────────────────

export const abrirCajaSchema = z.object({
  sucursal_id: uuidSchema,
  monto_apertura: z.number().min(0),
});
export type AbrirCajaInput = z.infer<typeof abrirCajaSchema>;

export const cerrarCajaSchema = z.object({
  monto_cierre: z.number().min(0),
  notas_cierre: z.string().optional(),
});
export type CerrarCajaInput = z.infer<typeof cerrarCajaSchema>;

export const listCajasQuerySchema = z.object({
  sucursal_id: uuidSchema.optional(),
  estado: z.enum(["ABIERTA", "CERRADA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCajasQuery = z.infer<typeof listCajasQuerySchema>;

// ─── Ventas ───────────────────────────────────────────────────────────────────

export const ventaItemSchema = z.object({
  producto_id: uuidSchema.optional(),
  descripcion: z.string().min(1).max(200),
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().positive(),
  descuento: z.number().min(0).optional(),
});

export const createVentaSchema = z.object({
  caja_id: uuidSchema,
  cliente_id: uuidSchema.optional(),
  tipo_venta: z.enum(["LIBRE", "SERVICIO", "REVISION_DOMICILIO", "REVISION_DEVOLUCION"]).optional(),
  orden_servicio_id: uuidSchema.optional(),
  visita_domicilio_id: uuidSchema.optional(),
  items: z.array(ventaItemSchema).min(1),
  tipo_comprobante: z.enum(["BOLETA", "FACTURA", "NOTA_VENTA"]).optional(),
  notas: z.string().optional(),
});
export type CreateVentaInput = z.infer<typeof createVentaSchema>;

export const anularVentaSchema = z.object({
  motivo: z.string().min(1).max(500),
});
export type AnularVentaInput = z.infer<typeof anularVentaSchema>;

export const listVentasQuerySchema = z.object({
  tipo_venta: z.enum(["LIBRE", "SERVICIO", "REVISION_DOMICILIO", "REVISION_DEVOLUCION"]).optional(),
  estado: z.enum(["PENDIENTE", "PAGADA", "PARCIAL", "ANULADA"]).optional(),
  caja_id: uuidSchema.optional(),
  cliente_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListVentasQuery = z.infer<typeof listVentasQuerySchema>;

// ─── Pagos de venta ───────────────────────────────────────────────────────────

export const addVentaPagoSchema = z.object({
  metodo_pago_id: uuidSchema,
  monto: z.number().positive(),
  referencia: z.string().max(100).optional(),
});
export type AddVentaPagoInput = z.infer<typeof addVentaPagoSchema>;

// ─── Envío ────────────────────────────────────────────────────────────────────

export const createVentaEnvioSchema = z.object({
  direccion_id: uuidSchema.optional(),
  direccion_texto: z.string().min(1).max(255),
  costo_envio: z.number().min(0).optional(),
  notas: z.string().optional(),
});
export type CreateVentaEnvioInput = z.infer<typeof createVentaEnvioSchema>;

export const updateEnvioEstadoSchema = z.object({
  estado: z.enum(["PENDIENTE", "EN_CAMINO", "ENTREGADO"]),
});
export type UpdateEnvioEstadoInput = z.infer<typeof updateEnvioEstadoSchema>;

// ─── Cotizaciones de venta ────────────────────────────────────────────────────

export const cotizacionVentaItemSchema = z.object({
  producto_id: uuidSchema.optional(),
  descripcion: z.string().min(1).max(200),
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().positive(),
});

export const createCotizacionVentaSchema = z.object({
  cliente_id: uuidSchema.optional(),
  items: z.array(cotizacionVentaItemSchema).min(1),
  fecha_vencimiento: z.string().optional(),
  notas: z.string().optional(),
});
export type CreateCotizacionVentaInput = z.infer<typeof createCotizacionVentaSchema>;

export const updateCotizacionVentaEstadoSchema = z.object({
  estado: z.enum(["BORRADOR", "ENVIADA", "APROBADA", "RECHAZADA", "VENCIDA"]),
});
export type UpdateCotizacionVentaEstadoInput = z.infer<typeof updateCotizacionVentaEstadoSchema>;

export const listCotizacionesVentaQuerySchema = z.object({
  cliente_id: uuidSchema.optional(),
  estado: z.enum(["BORRADOR", "ENVIADA", "APROBADA", "RECHAZADA", "VENCIDA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListCotizacionesVentaQuery = z.infer<typeof listCotizacionesVentaQuerySchema>;
