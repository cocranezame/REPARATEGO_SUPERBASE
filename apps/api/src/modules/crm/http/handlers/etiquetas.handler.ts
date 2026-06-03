import type { CreateEtiquetaInput, UpdateEtiquetaInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class EtiquetasHandler {
  constructor(private readonly repo: ICrmRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const etiquetas = await this.repo.listEtiquetas(tenantId);
    return c.json({ success: true, data: etiquetas });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateEtiquetaInput;
    try {
      const etiqueta = await this.repo.createEtiqueta(tenantId, body);
      return c.json({ success: true, data: etiqueta }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al crear etiqueta";
      throw new ApiError("ETIQUETA_ERROR", msg, 400);
    }
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateEtiquetaInput;
    const etiqueta = await this.repo.updateEtiqueta(tenantId, id, body);
    if (!etiqueta) throw new ApiError("ETIQUETA_NOT_FOUND", "Etiqueta no encontrada", 404);
    return c.json({ success: true, data: etiqueta });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const ok = await this.repo.deleteEtiqueta(tenantId, id);
    if (!ok) throw new ApiError("ETIQUETA_NOT_FOUND", "Etiqueta no encontrada", 404);
    return c.json({ success: true, data: { deleted: true } });
  };
}
