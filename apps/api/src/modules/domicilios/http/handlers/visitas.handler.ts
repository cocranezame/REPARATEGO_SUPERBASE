import type {
  CreateVisitaDomicilioInput,
  DisponibilidadTecnicoQuery,
  GenerarOsFromVisitaInput,
  ListVisitasDomicilioQuery,
  UpdateEstadoVisitaInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../../types/context.js";
import type { IDomicilioRepository } from "../../domain/ports/domicilio.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class VisitasHandler {
  constructor(private readonly repo: IDomicilioRepository) {}

  list = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as ListVisitasDomicilioQuery;
    const result = await this.repo.listVisitas(tenantId, {
      estado: query.estado,
      tecnico_id: query.tecnico_id,
      desde: query.desde,
      hasta: query.hasta,
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

  findById = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const visita = await this.repo.findVisitaById(tenantId, id);
    if (!visita) throw new ApiError("VISITA_NOT_FOUND", "Visita no encontrada", 404);
    return c.json({ success: true, data: visita });
  };

  create = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const body = c.req.valid("json") as CreateVisitaDomicilioInput;
    const visita = await this.repo.createVisita(tenantId, {
      cliente_id: body.cliente_id,
      ...(body.direccion_id !== undefined ? { direccion_id: body.direccion_id } : {}),
      direccion_texto: body.direccion_texto,
      distrito: body.distrito,
      ...(body.tecnico_id !== undefined ? { tecnico_id: body.tecnico_id } : {}),
      fecha_programada: body.fecha_programada,
      ...(body.hora_inicio !== undefined ? { hora_inicio: body.hora_inicio } : {}),
      ...(body.hora_fin !== undefined ? { hora_fin: body.hora_fin } : {}),
      ...(body.motivo_visita !== undefined ? { motivo_visita: body.motivo_visita } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });
    return c.json({ success: true, data: visita }, 201);
  };

  updateEstado = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as UpdateEstadoVisitaInput;

    try {
      const visita = await this.repo.updateEstado(tenantId, id, {
        estado: body.estado,
        ...(body.diagnostico_campo !== undefined
          ? { diagnostico_campo: body.diagnostico_campo }
          : {}),
        ...(body.motivo_cancelacion !== undefined
          ? { motivo_cancelacion: body.motivo_cancelacion }
          : {}),
        ...(body.tecnico_id !== undefined ? { tecnico_id: body.tecnico_id } : {}),
        ...(body.cobrar !== undefined ? { cobrar: body.cobrar } : {}),
        ...(body.caja_id !== undefined ? { caja_id: body.caja_id } : {}),
        ...(body.sucursal_id !== undefined ? { sucursal_id: body.sucursal_id } : {}),
        userId,
      });
      if (!visita) throw new ApiError("VISITA_NOT_FOUND", "Visita no encontrada", 404);
      return c.json({ success: true, data: visita });
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al actualizar estado";
      throw new ApiError("ESTADO_INVALID", msg, 400);
    }
  };

  generarOs = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id") as string;
    const userId = c.get("userId");
    const body = c.req.valid("json") as GenerarOsFromVisitaInput;

    try {
      const visita = await this.repo.generarOrdenServicio(tenantId, id, {
        categoria_id: body.categoria_id,
        sucursal_id: body.sucursal_id,
        problema_reportado: body.problema_reportado,
        ...(body.tipo_servicio !== undefined ? { tipo_servicio: body.tipo_servicio } : {}),
        ...(body.prioridad !== undefined ? { prioridad: body.prioridad } : {}),
        userId,
      });
      if (!visita) throw new ApiError("VISITA_NOT_FOUND", "Visita no encontrada", 404);
      return c.json({ success: true, data: visita }, 201);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      const msg = e instanceof Error ? e.message : "Error al generar OS";
      throw new ApiError("OS_ERROR", msg, 400);
    }
  };

  disponibilidad = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as DisponibilidadTecnicoQuery;
    const result = await this.repo.getDisponibilidad(tenantId, query.fecha, query.tecnico_id);
    return c.json({ success: true, data: result });
  };
}
