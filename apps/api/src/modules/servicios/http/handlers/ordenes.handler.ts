import type {
  CreateOrdenServicioInput,
  ListOrdenesServicioQuery,
  UpdateEstadoOrdenServicioInput,
  UpdateOrdenServicioInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IServicioRepository } from "../../domain/ports/servicio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class OrdenesHandler {
  constructor(private readonly repo: IServicioRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListOrdenesServicioQuery;
    const result = await this.repo.listOrdenes(tenantId, {
      ...(query.estado !== undefined ? { estado: query.estado } : {}),
      ...(query.canal !== undefined ? { canal: query.canal } : {}),
      ...(query.tipo_servicio !== undefined ? { tipo_servicio: query.tipo_servicio } : {}),
      ...(query.tecnico_id !== undefined ? { tecnico_id: query.tecnico_id } : {}),
      ...(query.sucursal_id !== undefined ? { sucursal_id: query.sucursal_id } : {}),
      ...(query.cliente_id !== undefined ? { cliente_id: query.cliente_id } : {}),
      ...(query.desde !== undefined ? { desde: query.desde } : {}),
      ...(query.hasta !== undefined ? { hasta: query.hasta } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
      page: query.page,
      pageSize: query.pageSize,
    });
    const totalPages = Math.ceil(result.total / query.pageSize);
    return c.json({
      success: true,
      data: result.items,
      meta: { total: result.total, page: query.page, pageSize: query.pageSize, totalPages },
    });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const body = c.req.valid("json") as CreateOrdenServicioInput;
    const orden = await this.repo.createOrden(
      tenantId,
      {
        instancia_id: body.instancia_id,
        ...(body.sucursal_id !== undefined ? { sucursal_id: body.sucursal_id } : {}),
        canal: body.canal,
        tipo_servicio: body.tipo_servicio,
        falla_ingreso: body.falla_ingreso,
        ...(body.visita_domicilio_id !== undefined
          ? { visita_domicilio_id: body.visita_domicilio_id }
          : {}),
        ...(body.lead_id !== undefined ? { lead_id: body.lead_id } : {}),
        ...(body.perifericos !== undefined ? { perifericos: body.perifericos } : {}),
      },
      userId
    );
    return c.json({ success: true, data: orden }, 201);
  };

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const orden = await this.repo.findOrdenById(tenantId, id);
    if (!orden) throw new ApiError("ORDEN_NOT_FOUND", "Orden de servicio no encontrada", 404);
    return c.json({ success: true, data: orden });
  };

  update = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateOrdenServicioInput;
    const orden = await this.repo.updateOrden(tenantId, id, {
      ...(body.tecnico_id !== undefined ? { tecnico_id: body.tecnico_id } : {}),
      ...(body.vendedor_id !== undefined ? { vendedor_id: body.vendedor_id } : {}),
      ...(body.diagnostico_tecnico !== undefined
        ? { diagnostico_tecnico: body.diagnostico_tecnico }
        : {}),
      ...(body.solucion !== undefined ? { solucion: body.solucion } : {}),
      ...(body.sucursal_id !== undefined ? { sucursal_id: body.sucursal_id } : {}),
    });
    if (!orden) throw new ApiError("ORDEN_NOT_FOUND", "Orden de servicio no encontrada", 404);
    return c.json({ success: true, data: orden });
  };

  updateEstado = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as UpdateEstadoOrdenServicioInput;

    try {
      const result = await this.repo.updateEstadoOrden(tenantId, id, {
        estado: body.estado,
        ...(body.observacion !== undefined ? { observacion: body.observacion } : {}),
        ...(body.motivo_devolucion !== undefined
          ? { motivo_devolucion: body.motivo_devolucion }
          : {}),
        userId,
      });
      return c.json({ success: true, data: result });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al actualizar estado";
      throw new ApiError("ESTADO_INVALID", msg, 400);
    }
  };
}
