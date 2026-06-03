import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── wa_cuenta ────────────────────────────────────────────────────────────────

export const createWaCuentaSchema = z.object({
  negocio_nombre: z.string().min(1).max(100),
  phone_number_id: z.string().min(1).max(50),
  waba_id: z.string().min(1).max(50),
  access_token: z.string().min(1),
  webhook_verify_token: z.string().min(1).max(100),
  nombre: z.string().max(100).optional(),
});
export type CreateWaCuentaInput = z.infer<typeof createWaCuentaSchema>;

export const updateWaCuentaSchema = z.object({
  negocio_nombre: z.string().min(1).max(100).optional(),
  access_token: z.string().min(1).optional(),
  webhook_verify_token: z.string().min(1).max(100).optional(),
  nombre: z.string().max(100).optional(),
  activo: z.boolean().optional(),
});
export type UpdateWaCuentaInput = z.infer<typeof updateWaCuentaSchema>;

// ─── Etapa ────────────────────────────────────────────────────────────────────

export const createEtapaSchema = z.object({
  nombre: z.string().min(1).max(100),
  codigo: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z_]+$/, "Solo mayúsculas y guiones bajos"),
  orden: z.number().int().min(1),
  objetivo: z.string().max(500).optional(),
  operador: z.enum(["IA", "BOT", "HUMANO", "SISTEMA"]),
  bot_id: uuidSchema.optional(),
  tiempo_espera_horas: z.number().int().min(1).optional(),
  max_intentos_recordatorio: z.number().int().min(1).max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido (ej: #3B82F6)")
    .optional(),
});
export type CreateEtapaInput = z.infer<typeof createEtapaSchema>;

export const updateEtapaSchema = createEtapaSchema
  .omit({ codigo: true })
  .partial()
  .extend({ activo: z.boolean().optional() });
export type UpdateEtapaInput = z.infer<typeof updateEtapaSchema>;

// ─── Transición ───────────────────────────────────────────────────────────────

export const createTransicionSchema = z.object({
  etapa_destino_id: uuidSchema,
});
export type CreateTransicionInput = z.infer<typeof createTransicionSchema>;

// ─── Etiqueta ─────────────────────────────────────────────────────────────────

export const createEtiquetaSchema = z.object({
  nombre: z.string().min(1).max(50),
  codigo: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z_]+$/, "Solo mayúsculas y guiones bajos"),
  grupo: z.enum(["IDENTIFICACION", "RUTA_ACTIVA", "CAPTURA_DATOS", "ESTADO_OPERATIVO"]),
  descripcion: z.string().max(500).optional(),
});
export type CreateEtiquetaInput = z.infer<typeof createEtiquetaSchema>;

export const updateEtiquetaSchema = createEtiquetaSchema
  .omit({ codigo: true })
  .partial()
  .extend({ activo: z.boolean().optional() });
export type UpdateEtiquetaInput = z.infer<typeof updateEtiquetaSchema>;

// ─── Lead ─────────────────────────────────────────────────────────────────────

export const listLeadsQuerySchema = z.object({
  etapa_id: uuidSchema.optional(),
  vendedor_id: uuidSchema.optional(),
  cliente_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
  utm_source: z.string().max(50).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_medium: z.string().max(50).optional(),
  activo: z.coerce.boolean().optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

export const createLeadSchema = z.object({
  wa_cuenta_id: uuidSchema,
  celular: z.string().min(7).max(20),
  etapa_id: uuidSchema.optional(),
  nombre: z.string().max(150).optional(),
  utm_source: z.string().max(50).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_medium: z.string().max(50).optional(),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = z.object({
  nombre: z.string().max(150).optional(),
  equipo_descripcion: z.string().optional(),
  falla_descripcion: z.string().optional(),
  ubicacion: z.string().optional(),
  sucursal_id: uuidSchema.optional(),
  cliente_id: uuidSchema.optional(),
  activo: z.boolean().optional(),
});
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export const moverEtapaSchema = z.object({
  etapa_destino_id: uuidSchema,
});
export type MoverEtapaInput = z.infer<typeof moverEtapaSchema>;

export const asignarEtiquetasSchema = z.object({
  etiqueta_ids: z.array(uuidSchema).min(1).max(20),
  asignado_por: z.enum(["NICO", "VENDEDOR", "SISTEMA"]).optional(),
});
export type AsignarEtiquetasInput = z.infer<typeof asignarEtiquetasSchema>;

export const asignarVendedorLeadSchema = z.object({
  vendedor_id: z.union([uuidSchema, z.literal("round-robin")]),
});
export type AsignarVendedorLeadInput = z.infer<typeof asignarVendedorLeadSchema>;

// ─── Nota ─────────────────────────────────────────────────────────────────────

export const createNotaSchema = z.object({
  contenido: z.string().min(1).max(2000),
  origen: z.enum(["NICO", "VENDEDOR"]).optional(),
});
export type CreateNotaInput = z.infer<typeof createNotaSchema>;

// ─── Conversación ─────────────────────────────────────────────────────────────

export const listConversacionesQuerySchema = z.object({
  modo: z.enum(["NICO", "VENDEDOR"]).optional(),
  estado: z.enum(["ACTIVA", "CERRADA"]).optional(),
  wa_cuenta_id: uuidSchema.optional(),
  vendedor_id: uuidSchema.optional(),
  desde: z.string().datetime({ offset: true }).optional(),
  hasta: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListConversacionesQuery = z.infer<typeof listConversacionesQuerySchema>;

export const cambiarModoSchema = z.object({
  modo: z.enum(["NICO", "VENDEDOR"]),
});
export type CambiarModoInput = z.infer<typeof cambiarModoSchema>;

export const asignarVendedorConvSchema = z.object({
  vendedor_id: uuidSchema,
});
export type AsignarVendedorConvInput = z.infer<typeof asignarVendedorConvSchema>;

// ─── Mensaje ──────────────────────────────────────────────────────────────────

export const enviarMensajeSchema = z.object({
  contenido: z.string().min(1).max(4096),
  tipo: z.enum(["TEXTO", "LINK"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type EnviarMensajeInput = z.infer<typeof enviarMensajeSchema>;

// ─── Plantilla ────────────────────────────────────────────────────────────────

export const createPlantillaSchema = z.object({
  nombre: z.string().min(1).max(100),
  contenido: z.string().min(1),
  variables: z.array(z.string()).optional(),
  meta_template_name: z.string().max(100).optional(),
});
export type CreatePlantillaInput = z.infer<typeof createPlantillaSchema>;

export const updatePlantillaSchema = createPlantillaSchema.partial();
export type UpdatePlantillaInput = z.infer<typeof updatePlantillaSchema>;

// ─── Bot ──────────────────────────────────────────────────────────────────────

export const updateBotSchema = z.object({
  activo: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  nombre: z.string().min(1).max(100).optional(),
});
export type UpdateBotInput = z.infer<typeof updateBotSchema>;

// ─── Agente ───────────────────────────────────────────────────────────────────

export const createAgenteSchema = z.object({
  nombre: z.string().min(1).max(50),
  canal: z.literal("WHATSAPP").optional(),
  modelo_ia: z.string().min(1).max(50),
  tono: z.string().max(1000).optional(),
  prompt_base: z.string().optional(),
  max_mensajes_contexto: z.number().int().min(5).max(100).optional(),
});
export type CreateAgenteInput = z.infer<typeof createAgenteSchema>;

export const updateAgenteSchema = z.object({
  tono: z.string().max(1000).optional(),
  prompt_base: z.string().optional(),
  max_mensajes_contexto: z.number().int().min(5).max(100).optional(),
  activo: z.boolean().optional(),
});
export type UpdateAgenteInput = z.infer<typeof updateAgenteSchema>;

// ─── Mensajería interna ───────────────────────────────────────────────────────

export const createMensajeInternoSchema = z.object({
  destinatario_id: uuidSchema,
  contenido: z.string().min(1).max(2000),
});
export type CreateMensajeInternoInput = z.infer<typeof createMensajeInternoSchema>;

export const listMensajesInternosQuerySchema = z.object({
  leido: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMensajesInternosQuery = z.infer<typeof listMensajesInternosQuerySchema>;

// ─── Métricas ─────────────────────────────────────────────────────────────────

export const metricasQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
    sucursal_id: uuidSchema.optional(),
  })
  .refine((data) => new Date(data.from) <= new Date(data.to), {
    message: "from debe ser anterior o igual a to",
    path: ["from"],
  });
export type MetricasQuery = z.infer<typeof metricasQuerySchema>;

// ─── Mensajes (conversación) ──────────────────────────────────────────────────

export const listMensajesQuerySchema = z.object({
  antes_de: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListMensajesQuery = z.infer<typeof listMensajesQuerySchema>;
