import { TipoDocumento } from "@kallpasoft/shared";
import { z } from "zod";
import { uuidSchema } from "./common.js";

const nivelClienteSchema = z.enum(["ALTO", "NORMAL", "BAJO"] as const);

const clienteBaseSchema = z.object({
  email: z.string().email().optional(),
  telefono: z.string().max(20).optional(),
  telefono_secundario: z.string().max(20).optional(),
  notas: z.string().optional(),
  distrito: z.string().max(100).optional(),
  nivel: nivelClienteSchema.default("NORMAL"),
});

const clienteNaturalSchema = clienteBaseSchema.extend({
  tipo_documento: z.enum([TipoDocumento.DNI, TipoDocumento.CE] as const),
  numero_documento: z.string().min(1).max(20),
  tipo_persona: z.literal("NATURAL"),
  nombres: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
});

const clienteJuridicaSchema = clienteBaseSchema.extend({
  tipo_documento: z.literal(TipoDocumento.RUC),
  numero_documento: z.string().length(11).regex(/^\d+$/),
  tipo_persona: z.literal("JURIDICA"),
  razon_social: z.string().min(1).max(200),
});

export const createClienteSchema = z.discriminatedUnion("tipo_persona", [
  clienteNaturalSchema,
  clienteJuridicaSchema,
]);
export type CreateClienteInput = z.infer<typeof createClienteSchema>;

export const updateClienteSchema = z.object({
  tipo_documento: z.nativeEnum(TipoDocumento).optional(),
  numero_documento: z.string().min(1).max(20).optional(),
  tipo_persona: z.enum(["NATURAL", "JURIDICA"] as const).optional(),
  nombres: z.string().min(1).max(100).optional(),
  apellidos: z.string().min(1).max(100).optional(),
  razon_social: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  telefono: z.string().max(20).optional(),
  telefono_secundario: z.string().max(20).optional(),
  notas: z.string().optional(),
  distrito: z.string().max(100).optional(),
  nivel: nivelClienteSchema.optional(),
});
export type UpdateClienteInput = z.infer<typeof updateClienteSchema>;

const etiquetaDireccionSchema = z.enum(["PRINCIPAL", "TRABAJO", "OTRO"] as const);

export const createClienteDireccionSchema = z.object({
  cliente_id: uuidSchema,
  etiqueta: etiquetaDireccionSchema.default("PRINCIPAL"),
  direccion: z.string().min(1).max(255),
  distrito: z.string().max(100).optional(),
  provincia: z.string().max(100).optional(),
  departamento: z.string().max(100).optional(),
  referencia: z.string().max(255).optional(),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
  es_principal: z.boolean().default(false),
});
export type CreateClienteDireccionInput = z.infer<typeof createClienteDireccionSchema>;

export const updateClienteDireccionSchema = createClienteDireccionSchema
  .omit({ cliente_id: true })
  .partial();
export type UpdateClienteDireccionInput = z.infer<typeof updateClienteDireccionSchema>;
