import { TipoMovimiento, TipoProducto } from "@kallpasoft/shared";
import { z } from "zod";
import { uuidSchema } from "./common.js";

export const createProductoSchema = z.object({
  tipo: z.nativeEnum(TipoProducto),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  categoria_id: uuidSchema,
  componente_id: uuidSchema.optional(),
  marca_id: uuidSchema.optional(),
  unidad_medida: z.string().max(10).optional(),
  precio_compra: z.number().positive().optional(),
  precio_venta: z.number().positive(),
  stock_minimo: z.number().int().min(0).optional(),
  imagen_url: z.string().url().optional(),
});
export type CreateProductoInput = z.infer<typeof createProductoSchema>;

export const updateProductoSchema = createProductoSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateProductoInput = z.infer<typeof updateProductoSchema>;

export const syncCompatibilidadesSchema = z.object({
  modelo_ids: z.array(uuidSchema),
});
export type SyncCompatibilidadesInput = z.infer<typeof syncCompatibilidadesSchema>;

export const createTasaPrecioSchema = z.object({
  nombre: z.string().min(1).max(50),
  porcentaje: z.number().min(0).max(999.99),
});
export type CreateTasaPrecioInput = z.infer<typeof createTasaPrecioSchema>;

export const updateTasaPrecioSchema = createTasaPrecioSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateTasaPrecioInput = z.infer<typeof updateTasaPrecioSchema>;

export const createMetodoPagoSchema = z.object({
  nombre: z.string().min(1).max(50),
});
export type CreateMetodoPagoInput = z.infer<typeof createMetodoPagoSchema>;

export const updateMetodoPagoSchema = createMetodoPagoSchema.partial().extend({
  activo: z.boolean().optional(),
});
export type UpdateMetodoPagoInput = z.infer<typeof updateMetodoPagoSchema>;

export const createLoteSchema = z.object({
  producto_id: uuidSchema,
  sucursal_id: uuidSchema,
  orden_compra_id: uuidSchema.optional(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  fecha_ingreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_vencimiento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type CreateLoteInput = z.infer<typeof createLoteSchema>;

const TIPOS_MANUALES = ["MERMA", "REAJUSTE", "TRANSFERENCIA"] as const;
export const createMovimientoSchema = z.object({
  producto_id: uuidSchema,
  lote_id: uuidSchema.optional(),
  sucursal_id: uuidSchema,
  tipo: z.enum(TIPOS_MANUALES),
  cantidad: z.number().int(),
  referencia_tipo: z.string().max(30).optional(),
  referencia_id: uuidSchema.optional(),
  notas: z.string().optional(),
});
export type CreateMovimientoInput = z.infer<typeof createMovimientoSchema>;

export const listLotesQuerySchema = z.object({
  producto_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListLotesQuery = z.infer<typeof listLotesQuerySchema>;

export const listMovimientosQuerySchema = z.object({
  producto_id: uuidSchema.optional(),
  tipo: z.nativeEnum(TipoMovimiento).optional(),
  sucursal_id: uuidSchema.optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});
export type ListMovimientosQuery = z.infer<typeof listMovimientosQuerySchema>;

export const listStockQuerySchema = z.object({
  producto_id: uuidSchema.optional(),
  sucursal_id: uuidSchema.optional(),
  alerta_minimo: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});
export type ListStockQuery = z.infer<typeof listStockQuerySchema>;
