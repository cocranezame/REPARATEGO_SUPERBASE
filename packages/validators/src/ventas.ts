import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── Caja ─────────────────────────────────────────────────────────────────────

export const abrirCajaSchema = z.object({
  sucursal_id: uuidSchema,
  monto_inicial: z.number().min(0),
});
export type AbrirCajaInput = z.infer<typeof abrirCajaSchema>;

export const cerrarCajaSchema = z.object({
  caja_id: uuidSchema,
  monto_fisico: z.number().min(0),
});
export type CerrarCajaInput = z.infer<typeof cerrarCajaSchema>;

export const listCajasQuerySchema = z.object({
  sucursal_id: uuidSchema.optional(),
  estado: z.enum(["ABIERTA", "CERRADA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListCajasQuery = z.infer<typeof listCajasQuerySchema>;

// ─── Crear venta ──────────────────────────────────────────────────────────────

const ventaItemInputSchema = z.object({
  tipo_item: z.enum(["PRODUCTO", "SERVICIO", "ENVIO", "MANUAL"]),
  produto_id: uuidSchema.optional(),
  lote_id: uuidSchema.optional(),
  sku: z.string().max(30).optional(),
  numero_serie: z.string().max(100).optional(),
  descripcion: z.string().min(1).max(200),
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().min(0),
  es_preventivo: z.boolean().optional(),
});

const pagoInputSchema = z.object({
  metodo_pago_id: uuidSchema,
  monto: z.number().positive(),
});

const datosEnvioInputSchema = z.object({
  direccion_id: uuidSchema.optional(),
  metodo_envio: z.string().max(100).optional(),
  fecha_programada: z.string().optional(),
  costo_envio: z.number().min(0).optional(),
});

export const createVentaSchema = z
  .object({
    tipo: z.enum(["LIBRE", "SERVICIO", "REVISION_DOMICILIO", "REVISION_DEVOLUCION"]),
    cliente_id: uuidSchema.optional(),
    orden_servicio_id: uuidSchema.optional(),
    visita_domicilio_id: uuidSchema.optional(),
    items: z.array(ventaItemInputSchema).min(1),
    requiere_envio: z.boolean().optional(),
    datos_envio: datosEnvioInputSchema.optional(),
    pagos: z.array(pagoInputSchema).optional(),
  })
  .refine(
    (data) => {
      // V7/V18: LIBRE y REVISION_* requieren al menos un pago al crear
      if (data.tipo !== "SERVICIO") {
        return (data.pagos?.length ?? 0) > 0;
      }
      return true;
    },
    { message: "Venta LIBRE y REVISION requieren al menos un pago", path: ["pagos"] }
  )
  .refine(
    (data) => {
      // V7: LIBRE — pago completo obligatorio (suma pagos = total items)
      if (data.tipo !== "LIBRE") return true;
      const centsTotalItems = data.items.reduce(
        (acc, item) => acc + Math.round(item.precio_unitario * item.cantidad * 100),
        0
      );
      const centsTotalPagos = (data.pagos ?? []).reduce(
        (acc, p) => acc + Math.round(p.monto * 100),
        0
      );
      return centsTotalItems === centsTotalPagos;
    },
    {
      message: "Venta LIBRE: la suma de pagos debe igualar el total de los items",
      path: ["pagos"],
    }
  )
  .refine(
    (data) => {
      if (data.requiere_envio === true) {
        return data.datos_envio !== undefined;
      }
      return true;
    },
    { message: "datos_envio requerido cuando requiere_envio es true", path: ["datos_envio"] }
  );
export type CreateVentaInput = z.infer<typeof createVentaSchema>;

// ─── Listar ventas ────────────────────────────────────────────────────────────

export const listVentasQuerySchema = z.object({
  estado_pago: z.enum(["PAGO_PENDIENTE", "COMPLETADA", "ANULADA"]).optional(),
  estado_despacho: z.enum(["SIN_ENVIO", "ENVIO_PENDIENTE", "DESPACHADO"]).optional(),
  tipo: z.enum(["LIBRE", "SERVICIO", "REVISION_DOMICILIO", "REVISION_DEVOLUCION"]).optional(),
  caja_id: uuidSchema.optional(),
  cliente_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListVentasQuery = z.infer<typeof listVentasQuerySchema>;

// ─── Pago ─────────────────────────────────────────────────────────────────────

export const addVentaPagoSchema = z.object({
  metodo_pago_id: uuidSchema,
  monto: z.number().positive(),
});
export type AddVentaPagoInput = z.infer<typeof addVentaPagoSchema>;

// ─── Anular venta ─────────────────────────────────────────────────────────────

export const anularVentaSchema = z.object({
  motivo: z.string().min(1).max(500),
});
export type AnularVentaInput = z.infer<typeof anularVentaSchema>;

// ─── Envío ────────────────────────────────────────────────────────────────────

export const actualizarEnvioSchema = z.object({
  direccion_id: uuidSchema.optional(),
  metodo_envio: z.string().max(100).optional(),
  fecha_programada: z.string().optional(),
  costo_envio: z.number().min(0).optional(),
});
export type ActualizarEnvioInput = z.infer<typeof actualizarEnvioSchema>;

export const listEnviosCalendarioQuerySchema = z.object({
  fecha_desde: z.string(),
  fecha_hasta: z.string(),
  sucursal_id: uuidSchema.optional(),
});
export type ListEnviosCalendarioQuery = z.infer<typeof listEnviosCalendarioQuerySchema>;

// ─── Cotizaciones referenciales ───────────────────────────────────────────────

const cotizacionVentaItemInputSchema = z.object({
  produto_id: uuidSchema.optional(),
  descripcion: z.string().min(1).max(200),
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().min(0),
});

export const createCotizacionVentaSchema = z.object({
  cliente_id: uuidSchema.optional(),
  items: z.array(cotizacionVentaItemInputSchema).min(1),
});
export type CreateCotizacionVentaInput = z.infer<typeof createCotizacionVentaSchema>;

export const listCotizacionesVentaQuerySchema = z.object({
  cliente_id: uuidSchema.optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListCotizacionesVentaQuery = z.infer<typeof listCotizacionesVentaQuerySchema>;
