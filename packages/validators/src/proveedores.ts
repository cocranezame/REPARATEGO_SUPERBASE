import { z } from "zod";
import { uuidSchema } from "./common.js";

export const createProveedorSchema = z.object({
  ruc: z.string().length(11).regex(/^\d+$/),
  razon_social: z.string().min(1).max(200),
  nombre_comercial: z.string().max(200).optional(),
  direccion: z.string().max(255).optional(),
  distrito: z.string().max(100).optional(),
  email: z.string().email().optional(),
  telefono: z.string().max(20).optional(),
  web: z.string().url().optional(),
  notas: z.string().optional(),
  calificacion: z.number().int().min(1).max(5).optional(),
});
export type CreateProveedorInput = z.infer<typeof createProveedorSchema>;

export const updateProveedorSchema = createProveedorSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateProveedorInput = z.infer<typeof updateProveedorSchema>;

export const createProveedorContactoSchema = z.object({
  nombre: z.string().min(1).max(100),
  cargo: z.string().max(100).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email().optional(),
  es_principal: z.boolean(),
});
export type CreateProveedorContactoInput = z.infer<typeof createProveedorContactoSchema>;

export const updateProveedorContactoSchema = createProveedorContactoSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateProveedorContactoInput = z.infer<typeof updateProveedorContactoSchema>;

export const createProveedorMetodoPagoSchema = z.object({
  tipo: z.string().min(1).max(30),
  banco: z.string().max(50).optional(),
  numero_cuenta: z.string().max(30).optional(),
  cci: z.string().max(25).optional(),
  titular: z.string().max(150).optional(),
});
export type CreateProveedorMetodoPagoInput = z.infer<typeof createProveedorMetodoPagoSchema>;

export const updateProveedorMetodoPagoSchema = createProveedorMetodoPagoSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateProveedorMetodoPagoInput = z.infer<typeof updateProveedorMetodoPagoSchema>;

export const createProveedorLineaSchema = z.object({
  categoria_id: uuidSchema.optional(),
  componente_id: uuidSchema.optional(),
  descripcion: z.string().max(200).optional(),
});
export type CreateProveedorLineaInput = z.infer<typeof createProveedorLineaSchema>;
