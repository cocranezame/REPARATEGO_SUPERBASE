import type { ListEventosQuery } from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class EventosHandler {
  constructor(private readonly repo: ICrmRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListEventosQuery;
    const result = await this.repo.listEventos(tenantId, {
      tipo: query.tipo,
      origen: query.origen,
      lead_id: query.lead_id,
      fecha_desde: query.fecha_desde,
      fecha_hasta: query.fecha_hasta,
      page: query.page,
      pageSize: query.pageSize,
    });
    return c.json({ success: true, data: result.items, total: result.total });
  };
}
