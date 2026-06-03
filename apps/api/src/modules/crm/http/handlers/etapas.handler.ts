import type {
  CreateEtapaInput,
  CreateTransicionInput,
  UpdateEtapaInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class EtapasHandler {
  constructor(private readonly repo: ICrmRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const etapas = await this.repo.listEtapas(tenantId);
    return c.json({ success: true, data: etapas });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateEtapaInput;
    try {
      const etapa = await this.repo.createEtapa(tenantId, body);
      return c.json({ success: true, data: etapa }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al crear etapa";
      throw new ApiError("ETAPA_ERROR", msg, 400);
    }
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateEtapaInput;
    const etapa = await this.repo.updateEtapa(tenantId, id, body);
    if (!etapa) throw new ApiError("ETAPA_NOT_FOUND", "Etapa no encontrada", 404);
    return c.json({ success: true, data: etapa });
  };

  remove = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    try {
      const ok = await this.repo.deleteEtapa(tenantId, id);
      if (!ok) throw new ApiError("ETAPA_NOT_FOUND", "Etapa no encontrada", 404);
      return c.json({ success: true, data: { deleted: true } });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al eliminar etapa";
      if (msg === "ETAPA_HAS_LEADS") {
        throw new ApiError(
          "ETAPA_HAS_LEADS",
          "La etapa tiene leads activos y no puede eliminarse",
          400
        );
      }
      throw new ApiError("ETAPA_ERROR", msg, 400);
    }
  };

  listTransiciones = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const transiciones = await this.repo.listTransiciones(tenantId, id);
    return c.json({ success: true, data: transiciones });
  };

  createTransicion = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateTransicionInput;
    try {
      const transicion = await this.repo.createTransicion(tenantId, id, body.etapa_destino_id);
      return c.json({ success: true, data: transicion }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al crear transición";
      throw new ApiError("TRANSICION_ERROR", msg, 400);
    }
  };

  deleteTransicion = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const destino_id = c.req.param("destino_id") as string;
    const ok = await this.repo.deleteTransicion(tenantId, id, destino_id);
    if (!ok) throw new ApiError("TRANSICION_NOT_FOUND", "Transición no encontrada", 404);
    return c.json({ success: true, data: { deleted: true } });
  };
}
