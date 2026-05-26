export type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

export function validateUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const VERSION = "0.0.1";
