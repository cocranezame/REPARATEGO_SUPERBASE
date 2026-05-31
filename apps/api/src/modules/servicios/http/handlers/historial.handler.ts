import type { AddObservacionInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class HistorialHandler {
  constructor(private readonly repo: IServicioRepository) {}

  listHistorial = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const items = await this.repo.listHistorial(tenantId, ordenId);
    return c.json({ success: true, data: items });
  };

  addObservacion = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as AddObservacionInput;
    const obs = await this.repo.addObservacion(
      tenantId,
      ordenId,
      { etapa: body.etapa, texto: body.texto },
      userId
    );
    return c.json({ success: true, data: obs }, 201);
  };

  listObservaciones = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const items = await this.repo.listObservaciones(tenantId, ordenId);
    return c.json({ success: true, data: items });
  };
}
