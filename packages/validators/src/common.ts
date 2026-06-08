import { z } from "zod";

// Zod v4 enforces version/variant bits — seed uses non-standard UUIDs so we
// accept any 8-4-4-4-12 hex string (matches Zod v3 behavior).
const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i;
export const uuidSchema = z.string().regex(UUID_REGEX, "Invalid UUID");
export type UUID = z.infer<typeof uuidSchema>;

export const tenantIdSchema = z.string().regex(UUID_REGEX, "Invalid UUID");

export const paginationParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type PaginationParamsInput = z.input<typeof paginationParamsSchema>;
export type PaginationParamsOutput = z.infer<typeof paginationParamsSchema>;
