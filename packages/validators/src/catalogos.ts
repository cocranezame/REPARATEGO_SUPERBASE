import { z } from "zod";
import { uuidSchema } from "./common.js";

export const createCategoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  categoria_padre_id: uuidSchema.optional(),
  orden: z.number().int().min(0).default(0),
});
export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;

export const updateCategoriaSchema = createCategoriaSchema.partial();
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;

export const createComponenteSchema = z.object({
  categoria_id: uuidSchema,
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
});
export type CreateComponenteInput = z.infer<typeof createComponenteSchema>;

export const updateComponenteSchema = createComponenteSchema.partial();
export type UpdateComponenteInput = z.infer<typeof updateComponenteSchema>;

export const createMarcaSchema = z.object({
  nombre: z.string().min(1).max(100),
  logo_url: z.string().url().optional(),
});
export type CreateMarcaInput = z.infer<typeof createMarcaSchema>;

export const updateMarcaSchema = createMarcaSchema.partial();
export type UpdateMarcaInput = z.infer<typeof updateMarcaSchema>;

export const createModeloSchema = z.object({
  marca_id: uuidSchema,
  categoria_id: uuidSchema,
  nombre: z.string().min(1).max(100),
});
export type CreateModeloInput = z.infer<typeof createModeloSchema>;

export const updateModeloSchema = createModeloSchema.partial();
export type UpdateModeloInput = z.infer<typeof updateModeloSchema>;
