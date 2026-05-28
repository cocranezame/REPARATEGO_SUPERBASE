import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { initSentry } from "./lib/sentry.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { healthRoutes } from "./modules/health/routes.js";
import { usuarioRoutes } from "./modules/usuarios/http/routes.js";
import type { HonoVariables } from "./types/context.js";

initSentry();

export const app = new Hono<{ Variables: HonoVariables }>();

app.use(cors());
app.use(requestId());
app.use(logger());
app.onError(errorHandler);

app.route("/api/v1", healthRoutes);
app.route("/api/v1", usuarioRoutes);

export type AppType = typeof app;
