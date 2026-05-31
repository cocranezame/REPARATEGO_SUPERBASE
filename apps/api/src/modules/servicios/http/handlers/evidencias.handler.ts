import type { AddEvidenciaInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class EvidenciasHandler {
  constructor(private readonly repo: IServicioRepository) {}

  add = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as AddEvidenciaInput;
    const evidencia = await this.repo.addEvidencia(
      tenantId,
      ordenId,
      {
        url: body.url,
        ...(body.etapa !== undefined ? { etapa: body.etapa } : {}),
        ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
      },
      userId
    );
    return c.json({ success: true, data: evidencia }, 201);
  };

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const ordenId = c.req.param("id") as string;
    const items = await this.repo.listEvidencias(tenantId, ordenId);
    return c.json({ success: true, data: items });
  };
}
