import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: ContentfulStatusCode = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return c.json(
      {
        success: false,
        error: { code: err.code, message: err.message, details: err.details },
      },
      err.status
    );
  }

  console.error("[API Error]", err);
  return c.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    },
    500
  );
};
