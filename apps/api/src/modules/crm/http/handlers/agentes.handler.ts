import type {
  CreateAgenteInput,
  ListAccionesAgenteQuery,
  UpdateAgenteInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class AgentesHandler {
  constructor(private readonly repo: ICrmRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const items = await this.repo.listAgentes(tenantId);
    return c.json({ success: true, data: items });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateAgenteInput;
    const agente = await this.repo.createAgente(tenantId, body);
    return c.json({ success: true, data: agente }, 201);
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateAgenteInput;
    const agente = await this.repo.updateAgente(tenantId, id, body);
    if (!agente) throw new ApiError("AGENTE_NOT_FOUND", "Agente no encontrado", 404);
    return c.json({ success: true, data: agente });
  };

  listAcciones = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const query = c.req.valid("query") as ListAccionesAgenteQuery;
    const result = await this.repo.listAccionesAgente(tenantId, id, query);
    return c.json({ success: true, data: result.items, total: result.total });
  };
}
