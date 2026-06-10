import type {
  CalcularPlanillaInput,
  CalcularPlanillaTodosInput,
  ListPlanillaParamsInput,
  PagarPlanillaInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IAsistenciaRepository } from "../../domain/ports/asistencia.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class PlanillaHandler {
  constructor(private readonly repo: IAsistenciaRepository) {}

  calcular = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const adminId = c.get("userId");
    const body = c.req.valid("json") as CalcularPlanillaInput;
    const planilla = await this.repo.calcularPlanilla(tenantId, adminId, {
      usuario_id: body.usuario_id,
      periodo: body.periodo,
    });
    return c.json({ success: true, data: planilla }, 200);
  };

  calcularTodos = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const adminId = c.get("userId");
    const body = c.req.valid("json") as CalcularPlanillaTodosInput;
    const result = await this.repo.calcularPlanillaTodos(tenantId, adminId, body.periodo);
    return c.json({ success: true, data: result });
  };

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListPlanillaParamsInput;
    const result = await this.repo.listPlanillas(tenantId, {
      periodo: query.periodo,
      estado: query.estado,
      usuario_id: query.usuario_id,
      page: query.page,
      limit: query.limit,
    });
    return c.json({ success: true, data: result });
  };

  findDetalle = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const planilla = await this.repo.findPlanillaDetalle(tenantId, id);
    if (!planilla) throw new ApiError("PLANILLA_NOT_FOUND", "Planilla no encontrada", 404);
    return c.json({ success: true, data: planilla });
  };

  aprobar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const adminId = c.get("userId");
    const id = c.req.param("id") as string;
    const planilla = await this.repo.aprobarPlanilla(tenantId, adminId, id);
    if (!planilla) throw new ApiError("PLANILLA_NOT_FOUND", "Planilla no encontrada", 404);
    return c.json({ success: true, data: planilla });
  };

  pagar = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as PagarPlanillaInput;
    const planilla = await this.repo.pagarPlanilla(tenantId, id, body.fecha_pago);
    if (!planilla) throw new ApiError("PLANILLA_NOT_FOUND", "Planilla no encontrada", 404);
    return c.json({ success: true, data: planilla });
  };
}
