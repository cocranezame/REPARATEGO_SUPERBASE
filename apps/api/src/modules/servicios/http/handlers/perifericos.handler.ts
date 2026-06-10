import type { CreatePerifericoInput, ListPerifericosQuery } from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class PerifericosHandler {
  constructor(private readonly repo: IServicioRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListPerifericosQuery;
    const perifericos = await this.repo.listPerifericos(tenantId, {
      ...(query.categoria_id !== undefined ? { categoria_id: query.categoria_id } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    });
    return c.json({ success: true, data: perifericos });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreatePerifericoInput;
    const periferico = await this.repo.createPeriferico(tenantId, {
      categoria_id: body.categoria_id,
      nombre: body.nombre,
    });
    return c.json({ success: true, data: periferico }, 201);
  };
}
