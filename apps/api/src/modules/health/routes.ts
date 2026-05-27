import { pingDbFromEnv } from "@kallpasoft/db";
import { Hono } from "hono";
import type { HonoVariables } from "../../types/context.js";

const healthRoutes = new Hono<{ Variables: HonoVariables }>();

healthRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

healthRoutes.get("/health/db", async (c) => {
  try {
    await pingDbFromEnv();
    return c.json({ success: true, data: { status: "ok", db: "connected" } });
  } catch {
    return c.json(
      { success: false, error: { code: "DB_ERROR", message: "Database connection failed" } },
      503
    );
  }
});

export { healthRoutes };
