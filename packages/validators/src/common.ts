import { z } from "zod";

export const uuidSchema = z.string().uuid();
export type UUID = z.infer<typeof uuidSchema>;

export const tenantIdSchema = z.string().uuid();

export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type PaginationParamsInput = z.input<typeof paginationParamsSchema>;
export type PaginationParamsOutput = z.infer<typeof paginationParamsSchema>;
