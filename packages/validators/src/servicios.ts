import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── Órdenes de servicio ──────────────────────────────────────────────────────

export const createOrdenServicioSchema = z.object({
  cliente_id: uuidSchema,
  sucursal_id: uuidSchema,
  categoria_id: uuidSchema,
  marca_id: uuidSchema.optional(),
  modelo_id: uuidSchema.optional(),
  serie_equipo: z.string().max(50).optional(),
  color_equipo: z.string().max(30).optional(),
  problema_reportado: z.string().min(1).max(2000),
  tipo_servicio: z.enum(["CORRECTIVO", "PREVENTIVO"]).optional(),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
  notas_internas: z.string().optional(),
});
export type CreateOrdenServicioInput = z.infer<typeof createOrdenServicioSchema>;

export const updateOrdenServicioSchema = z.object({
  tecnico_id: uuidSchema.optional(),
  diagnostico_tecnico: z.string().optional(),
  solucion_aplicada: z.string().optional(),
  notas_internas: z.string().optional(),
  prioridad: z.enum(["BAJA", "NORMAL", "ALTA", "URGENTE"]).optional(),
});
export type UpdateOrdenServicioInput = z.infer<typeof updateOrdenServicioSchema>;

export const updateEstadoOrdenServicioSchema = z.object({
  estado: z.enum([
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
  ]),
  notas: z.string().optional(),
});
export type UpdateEstadoOrdenServicioInput = z.infer<typeof updateEstadoOrdenServicioSchema>;

export const listOrdenesServicioQuerySchema = z.object({
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
export type ListOrdenesServicioQuery = z.infer<typeof listOrdenesServicioQuerySchema>;

// ─── Componentes afectados ────────────────────────────────────────────────────

export const ordenServicioComponenteItemSchema = z.object({
  componente_id: uuidSchema,
  es_preliminar: z.boolean(),
  estado_componente: z.enum(["DAÑADO", "FALTANTE", "OK"]),
  notas: z.string().optional(),
});

export const addComponentesOrdenServicioSchema = z.object({
  items: z.array(ordenServicioComponenteItemSchema).min(1),
});
export type AddComponentesOrdenServicioInput = z.infer<typeof addComponentesOrdenServicioSchema>;

// ─── Cotización al cliente ────────────────────────────────────────────────────

export const cotizacionItemSchema = z.object({
  producto_id: uuidSchema.optional(),
  descripcion: z.string().min(1).max(200),
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().positive(),
  tipo: z.enum(["REPUESTO", "MANO_OBRA"]),
});

export const addCotizacionOrdenServicioSchema = z.object({
  items: z.array(cotizacionItemSchema).min(1),
});
export type AddCotizacionOrdenServicioInput = z.infer<typeof addCotizacionOrdenServicioSchema>;

export const aprobarCotizacionSchema = z.object({
  aprobado: z.boolean(),
});
export type AprobarCotizacionInput = z.infer<typeof aprobarCotizacionSchema>;

// ─── Evidencias ───────────────────────────────────────────────────────────────

export const addEvidenciaSchema = z.object({
  url: z.string().max(500).min(1),
  tipo_archivo: z.enum(["IMAGE", "VIDEO"]),
  momento: z.enum(["RECEPCION", "DIAGNOSTICO", "REPARACION", "ENTREGA"]),
  descripcion: z.string().max(200).optional(),
});
export type AddEvidenciaInput = z.infer<typeof addEvidenciaSchema>;
