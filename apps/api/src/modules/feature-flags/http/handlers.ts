import type { UpsertFeatureFlagInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IFeatureFlagRepository } from "../domain/ports/feature-flag.repository.js";
import { listFeatureFlags } from "../domain/use-cases/list-feature-flags.js";
import { upsertFeatureFlag } from "../domain/use-cases/upsert-feature-flag.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createFeatureFlagHandlers(repo: IFeatureFlagRepository) {
  async function list(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const flags = await listFeatureFlags(repo, tenantId);
    return c.json({ success: true, data: flags });
  }

  async function upsert(c: HonoCtx) {
    const clave = c.req.param("clave") as string;
    const body = c.req.valid("json") as UpsertFeatureFlagInput;
    const tenantId = c.get("tenantId");

    if (!clave || clave.trim().length === 0) {
      throw new ApiError("INVALID_CLAVE", "La clave no puede estar vacía", 400);
    }

    const flag = await upsertFeatureFlag(repo, tenantId, clave.toUpperCase(), body.habilitado);
    return c.json({ success: true, data: flag });
  }

  return { list, upsert };
}
