import { validator } from "hono/validator";

type SafeParseable<T> = {
  safeParse(
    data: unknown
  ): { success: true; data: T } | { success: false; error: { flatten(): unknown } };
};

export function validateBody<T>(schema: SafeParseable<T>) {
  return validator("json", (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: result.error.flatten(),
          },
        },
        400
      );
    }
    return result.data;
  });
}

export function validateQuery<T>(schema: SafeParseable<T>) {
  return validator("query", (value, c) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query params",
            details: result.error.flatten(),
          },
        },
        400
      );
    }
    return result.data;
  });
}
