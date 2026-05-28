import { RolUsuario, TipoDocumento } from "@kallpasoft/shared";
import { z } from "zod";
import { uuidSchema } from "./common.js";

export const loginSchema = z.object({
  numero_documento: z.string().min(1).max(20),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUsuarioSchema = z.object({
  tipo_documento: z.nativeEnum(TipoDocumento),
  numero_documento: z.string().min(1).max(20),
  nombres: z.string().min(1).max(100),
  apellidos: z.string().min(1).max(100),
  email: z.string().email().optional(),
  telefono: z.string().max(20).optional(),
  rol: z.nativeEnum(RolUsuario),
  password: z.string().min(8).max(100),
  sucursal_id: uuidSchema.optional(),
});
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;

export const updateUsuarioSchema = createUsuarioSchema.omit({ password: true }).partial();
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;

export const createSucursalSchema = z.object({
  nombre: z.string().min(1).max(100),
  direccion: z.string().max(255).optional(),
  distrito: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  es_principal: z.boolean().default(false),
});
export type CreateSucursalInput = z.infer<typeof createSucursalSchema>;

export const updateSucursalSchema = createSucursalSchema.partial();
export type UpdateSucursalInput = z.infer<typeof updateSucursalSchema>;

export const upsertFeatureFlagSchema = z.object({
  habilitado: z.boolean(),
});
export type UpsertFeatureFlagInput = z.infer<typeof upsertFeatureFlagSchema>;
