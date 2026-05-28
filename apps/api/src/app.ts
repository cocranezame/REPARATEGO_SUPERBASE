import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import { initSentry } from "./lib/sentry.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { authRoutes } from "./modules/auth/http/routes.js";
import { featureFlagRoutes } from "./modules/feature-flags/http/routes.js";
import { healthRoutes } from "./modules/health/routes.js";
import { sucursalRoutes } from "./modules/sucursales/http/routes.js";
import { usuarioRoutes } from "./modules/usuarios/http/routes.js";
import type { HonoVariables } from "./types/context.js";

initSentry();

export const app = new Hono<{ Variables: HonoVariables }>();

app.use(cors());
app.use(requestId());
app.use(logger());
app.onError(errorHandler);

app.route("/api/v1", healthRoutes);
app.route("/api/v1", authRoutes);
app.route("/api/v1", usuarioRoutes);
app.route("/api/v1", sucursalRoutes);
app.route("/api/v1", featureFlagRoutes);

export type AppType = typeof app;
