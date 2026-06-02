import { TipoServicio } from "@kallpasoft/shared";
import { z } from "zod";
import { uuidSchema } from "./common.js";

// ─── Tarifas por distrito ──────────────────────────────────────────────────

export const createTarifaDistritoSchema = z.object({
  distrito: z.string().min(1).max(100),
  provincia: z.string().min(1).max(100).optional(),
  tarifa: z.number().positive(),
});
export type CreateTarifaDistritoInput = z.infer<typeof createTarifaDistritoSchema>;

export const updateTarifaDistritoSchema = z.object({
  distrito: z.string().min(1).max(100).optional(),
  provincia: z.string().min(1).max(100).optional(),
  tarifa: z.number().positive().optional(),
  activo: z.boolean().optional(),
});
export type UpdateTarifaDistritoInput = z.infer<typeof updateTarifaDistritoSchema>;

export const listTarifasDistritoQuerySchema = z.object({
  search: z.string().optional(),
  activo: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
});
export type ListTarifasDistritoQuery = z.infer<typeof listTarifasDistritoQuerySchema>;

// ─── Visitas a domicilio ───────────────────────────────────────────────────

export const createVisitaDomicilioSchema = z.object({
  cliente_id: uuidSchema,
  direccion_id: uuidSchema.optional(),
  direccion_texto: z.string().min(1).max(255),
  distrito: z.string().min(1).max(100),
  tecnico_id: uuidSchema.optional(),
  fecha_programada: z.string().min(1),
  hora_inicio: z.string().optional(),
  hora_fin: z.string().optional(),
  motivo_visita: z.string().optional(),
  notas: z.string().optional(),
});
export type CreateVisitaDomicilioInput = z.infer<typeof createVisitaDomicilioSchema>;

export const updateEstadoVisitaSchema = z.object({
  estado: z.enum([
    "POR_VALIDAR",
    "VALIDADA",
    "ASIGNADA",
    "EN_CAMINO",
    "EN_SITIO",
    "TERMINADA",
    "CANCELADA",
  ]),
  diagnostico_campo: z.string().optional(),
  motivo_cancelacion: z.string().optional(),
  tecnico_id: uuidSchema.optional(),
  cobrar: z.boolean().optional(),
  caja_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
});
export type UpdateEstadoVisitaInput = z.infer<typeof updateEstadoVisitaSchema>;

export const generarOsFromVisitaSchema = z.object({
  instancia_id: uuidSchema,
  sucursal_id: uuidSchema,
  falla_ingreso: z.string().min(1).max(2000),
  tipo_servicio: z.nativeEnum(TipoServicio).optional(),
});
export type GenerarOsFromVisitaInput = z.infer<typeof generarOsFromVisitaSchema>;

export const listVisitasDomicilioQuerySchema = z.object({
  estado: z
    .enum([
      "POR_VALIDAR",
      "VALIDADA",
      "ASIGNADA",
      "EN_CAMINO",
      "EN_SITIO",
      "TERMINADA",
      "CANCELADA",
    ])
    .optional(),
  tecnico_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListVisitasDomicilioQuery = z.infer<typeof listVisitasDomicilioQuerySchema>;

export const disponibilidadTecnicoQuerySchema = z.object({
  fecha: z.string().min(1),
  tecnico_id: uuidSchema.optional(),
});
export type DisponibilidadTecnicoQuery = z.infer<typeof disponibilidadTecnicoQuerySchema>;
