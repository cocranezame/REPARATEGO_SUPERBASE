import {
  CanalAceptacion,
  CanalServicio,
  EstadoOrdenServicio,
  EstadoRequerimiento,
  EstadoSkuAsignado,
  EtapaComponente,
  MetodoAceptacion,
  MotivoDevolucion,
  TipoAccionComponente,
  TipoAceptacion,
  TipoAfectacion,
  TipoItemCotizacion,
  TipoServicio,
} from "@kallpasoft/shared";
import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── Periférico (catálogo por categoría) ─────────────────────────────────────

export const createPerifericoSchema = z.object({
  categoria_id: uuidSchema,
  nombre: z.string().min(1).max(100),
});
export type CreatePerifericoInput = z.infer<typeof createPerifericoSchema>;

export const updatePerifericoSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  activo: z.boolean().optional(),
});
export type UpdatePerifericoInput = z.infer<typeof updatePerifericoSchema>;

export const listPerifericosQuerySchema = z.object({
  categoria_id: uuidSchema.optional(),
  activo: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});
export type ListPerifericosQuery = z.infer<typeof listPerifericosQuerySchema>;

// ─── Costo de revisión (uno por categoría) ────────────────────────────────────

export const createCostoRevisionSchema = z.object({
  categoria_id: uuidSchema,
  monto: z.number().positive(),
});
export type CreateCostoRevisionInput = z.infer<typeof createCostoRevisionSchema>;

export const updateCostoRevisionSchema = z.object({
  monto: z.number().positive().optional(),
  activo: z.boolean().optional(),
});
export type UpdateCostoRevisionInput = z.infer<typeof updateCostoRevisionSchema>;

// ─── Instancia (equipo físico del cliente) ────────────────────────────────────

export const createInstanciaSchema = z.object({
  cliente_id: uuidSchema,
  producto_id: uuidSchema,
  numero_serie: z.string().max(100).optional(),
});
export type CreateInstanciaInput = z.infer<typeof createInstanciaSchema>;

export const listInstanciasQuerySchema = z.object({
  cliente_id: uuidSchema.optional(),
  producto_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListInstanciasQuery = z.infer<typeof listInstanciasQuerySchema>;

// ─── Imágenes de instancia ────────────────────────────────────────────────────

export const addInstanciaImagenSchema = z.object({
  url: z.string().url().max(2000),
  descripcion: z.string().max(500).optional(),
  orden: z.number().int().min(1).max(3).optional(),
});
export type AddInstanciaImagenInput = z.infer<typeof addInstanciaImagenSchema>;

// ─── Orden de servicio ────────────────────────────────────────────────────────

export const createOrdenServicioSchema = z.object({
  instancia_id: uuidSchema,
  sucursal_id: uuidSchema.optional(),
  canal: z.nativeEnum(CanalServicio).default("TIENDA"),
  tipo_servicio: z.nativeEnum(TipoServicio).default("REPARACION"),
  falla_ingreso: z.string().min(1).max(2000),
  costo_revision: z.number().min(0),
  visita_domicilio_id: uuidSchema.optional(),
  lead_id: uuidSchema.optional(),
});
export type CreateOrdenServicioInput = z.infer<typeof createOrdenServicioSchema>;

export const updateOrdenServicioSchema = z.object({
  tecnico_id: uuidSchema.optional(),
  vendedor_id: uuidSchema.optional(),
  diagnostico_tecnico: z.string().max(5000).optional(),
  solucion: z.string().max(5000).optional(),
  sucursal_id: uuidSchema.optional(),
});
export type UpdateOrdenServicioInput = z.infer<typeof updateOrdenServicioSchema>;

export const updateEstadoOrdenServicioSchema = z.object({
  estado: z.nativeEnum(EstadoOrdenServicio),
  observacion: z.string().max(1000).optional(),
  motivo_devolucion: z.nativeEnum(MotivoDevolucion).optional(),
});
export type UpdateEstadoOrdenServicioInput = z.infer<typeof updateEstadoOrdenServicioSchema>;

export const listOrdenesServicioQuerySchema = z.object({
  estado: z.nativeEnum(EstadoOrdenServicio).optional(),
  canal: z.nativeEnum(CanalServicio).optional(),
  tipo_servicio: z.nativeEnum(TipoServicio).optional(),
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

// ─── Periféricos de la orden ──────────────────────────────────────────────────

export const syncPerifericosOrdenSchema = z.object({
  periferico_ids: z.array(uuidSchema),
});
export type SyncPerifericosOrdenInput = z.infer<typeof syncPerifericosOrdenSchema>;

// ─── Componentes afectados ────────────────────────────────────────────────────

export const componenteItemSchema = z.object({
  componente_id: uuidSchema,
  tipo_afectacion: z.nativeEnum(TipoAfectacion),
  tipo_accion: z.nativeEnum(TipoAccionComponente).default("REPARACION"),
  etapa: z.nativeEnum(EtapaComponente),
});
export type ComponenteItemInput = z.infer<typeof componenteItemSchema>;

export const upsertComponentesOrdenSchema = z.object({
  etapa: z.nativeEnum(EtapaComponente),
  items: z.array(componenteItemSchema).min(0),
});
export type UpsertComponentesOrdenInput = z.infer<typeof upsertComponentesOrdenSchema>;

// ─── Cotización / presupuesto ─────────────────────────────────────────────────

export const buscarPresupuestoQuerySchema = z.object({
  tipo: z.enum(["REPUESTO", "SERVICIO", "MANUAL"]).optional(),
  categoria_id: uuidSchema.optional(),
  marca_id: uuidSchema.optional(),
  modelo_id: uuidSchema.optional(),
  componente_id: uuidSchema.optional(),
  busqueda: z.string().optional(),
  nivel: z.enum(["COMPAT", "MARCA", "CATEGORIA", "GLOBAL"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type BuscarPresupuestoQuery = z.infer<typeof buscarPresupuestoQuerySchema>;

export const cotizacionItemSchema = z.object({
  tipo_item: z.nativeEnum(TipoItemCotizacion),
  producto_id: uuidSchema.optional(),
  componente_id: uuidSchema.optional(),
  descripcion_manual: z.string().max(500).optional(),
  cantidad: z.number().int().min(1),
  precio_unitario: z.number().min(0),
  es_preventivo: z.boolean(),
});
export type CotizacionItemInput = z.infer<typeof cotizacionItemSchema>;

export const registrarCotizacionSchema = z
  .object({
    items: z.array(cotizacionItemSchema).min(1),
    observacion: z.string().max(1000).optional(),
  })
  .refine(
    (d) =>
      d.items.every((it) => {
        if (it.tipo_item === "MANUAL") return it.descripcion_manual !== undefined;
        if (it.tipo_item === "REPUESTO" || it.tipo_item === "SERVICIO")
          return it.producto_id !== undefined;
        return true;
      }),
    { message: "MANUAL requiere descripcion_manual; REPUESTO/SERVICIO requieren producto_id" }
  );
export type RegistrarCotizacionInput = z.infer<typeof registrarCotizacionSchema>;

// ─── Evidencias ───────────────────────────────────────────────────────────────

export const addEvidenciaSchema = z.object({
  url: z.string().url().max(2000),
  etapa: z.string().max(30).optional(),
  descripcion: z.string().max(500).optional(),
});
export type AddEvidenciaInput = z.infer<typeof addEvidenciaSchema>;

// ─── SKUs asignados ───────────────────────────────────────────────────────────

export const asignarSkuSchema = z.object({
  lote_id: uuidSchema,
  producto_id: uuidSchema,
  cantidad: z.number().int().min(1).default(1),
  precio_presupuesto: z.number().min(0),
});
export type AsignarSkuInput = z.infer<typeof asignarSkuSchema>;

export const continuarConEstadoSchema = z.object({
  estado: z.enum(["PRIORIDAD", "REPARADO"]),
});
export type ContinuarConEstadoInput = z.infer<typeof continuarConEstadoSchema>;

export const updateSkuEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoSkuAsignado),
});
export type UpdateSkuEstadoInput = z.infer<typeof updateSkuEstadoSchema>;

// ─── Requerimientos ───────────────────────────────────────────────────────────

export const createRequerimientoSchema = z.object({
  producto_id: uuidSchema.optional(),
  imagen_url: z.string().url().max(2000).optional(),
  descripcion: z.string().min(1).max(1000),
  cantidad: z.number().int().min(1).default(1),
  observacion: z.string().max(500).optional(),
});
export type CreateRequerimientoInput = z.infer<typeof createRequerimientoSchema>;

export const updateRequerimientoEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoRequerimiento),
});
export type UpdateRequerimientoEstadoInput = z.infer<typeof updateRequerimientoEstadoSchema>;

export const listRequerimientosQuerySchema = z.object({
  estado: z.nativeEnum(EstadoRequerimiento).optional(),
  orden_servicio_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListRequerimientosQuery = z.infer<typeof listRequerimientosQuerySchema>;

// ─── Aceptaciones (trazabilidad legal INDECOPI) ───────────────────────────────

export const aceptacionManualSchema = z.object({
  tipo: z.nativeEnum(TipoAceptacion),
  canal_aceptacion: z.enum([CanalAceptacion.MANUAL_TIENDA, CanalAceptacion.MANUAL_WHATSAPP]),
  manual_reason: z.enum(["TIENDA", "WHATSAPP"]),
  evidence_image_url: z.string().url().max(2000).optional(),
  preventivo_accepted: z.boolean().optional(),
  password: z.string().min(1),
});
export type AceptacionManualInput = z.infer<typeof aceptacionManualSchema>;

export const aceptacionPortalSchema = z.object({
  tipo: z.nativeEnum(TipoAceptacion),
  ip_address: z.string().max(45).optional(),
  documento_version: z.string().max(20),
  texto_mostrado: z.string(),
  metodo_aceptacion: z.nativeEnum(MetodoAceptacion),
  preventivo_accepted: z.boolean().optional(),
});
export type AceptacionPortalInput = z.infer<typeof aceptacionPortalSchema>;

// ─── Historial ────────────────────────────────────────────────────────────────

export const listHistorialQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListHistorialQuery = z.infer<typeof listHistorialQuerySchema>;

// ─── Observaciones ────────────────────────────────────────────────────────────

export const addObservacionSchema = z.object({
  etapa: z.string().min(1).max(30),
  texto: z.string().min(1).max(2000),
});
export type AddObservacionInput = z.infer<typeof addObservacionSchema>;
