import { Hono } from "hono";
import type { HonoVariables } from "../../types/context.js";

const healthRoutes = new Hono<{ Variables: HonoVariables }>();

healthRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

export { healthRoutes };
