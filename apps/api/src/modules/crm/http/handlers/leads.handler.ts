import type {
  AsignarEtiquetasInput,
  AsignarVendedorLeadInput,
  CreateNotaInput,
  ListLeadsQuery,
  MoverEtapaInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class LeadsHandler {
  constructor(private readonly repo: ICrmRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListLeadsQuery;
    const result = await this.repo.listLeads(tenantId, query);
    return c.json({ success: true, data: result.items, total: result.total });
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const lead = await this.repo.findLeadById(tenantId, id);
    if (!lead) throw new ApiError("LEAD_NOT_FOUND", "Lead no encontrado", 404);
    return c.json({ success: true, data: lead });
  };

  moverEtapa = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as MoverEtapaInput;
    try {
      const lead = await this.repo.moverEtapaLead(tenantId, id, body.etapa_destino_id, userId);
      return c.json({ success: true, data: lead });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al mover etapa";
      if (msg === "Transición no permitida") {
        throw new ApiError("TRANSICION_NO_PERMITIDA", "Transición de etapa no permitida", 400);
      }
      if (msg === "Lead no encontrado") {
        throw new ApiError("LEAD_NOT_FOUND", "Lead no encontrado", 404);
      }
      throw new ApiError("LEAD_ERROR", msg, 400);
    }
  };

  asignarEtiquetas = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AsignarEtiquetasInput;
    try {
      const lead = await this.repo.asignarEtiquetas(
        tenantId,
        id,
        body.etiqueta_ids,
        body.asignado_por ?? "VENDEDOR"
      );
      return c.json({ success: true, data: lead });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al asignar etiquetas";
      throw new ApiError("LEAD_ERROR", msg, 400);
    }
  };

  asignarVendedor = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AsignarVendedorLeadInput;
    try {
      const lead = await this.repo.asignarVendedor(tenantId, id, body.vendedor_id);
      return c.json({ success: true, data: lead });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al asignar vendedor";
      throw new ApiError("LEAD_ERROR", msg, 400);
    }
  };

  createNota = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as CreateNotaInput;
    try {
      const nota = await this.repo.createNota(tenantId, id, body.contenido, userId);
      return c.json({ success: true, data: nota }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al crear nota";
      throw new ApiError("NOTA_ERROR", msg, 400);
    }
  };
}
