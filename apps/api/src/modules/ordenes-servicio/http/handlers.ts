import type {
  AddComponentesOrdenServicioInput,
  AddCotizacionOrdenServicioInput,
  AddEvidenciaInput,
  AprobarCotizacionInput,
  CreateOrdenServicioInput,
  UpdateEstadoOrdenServicioInput,
  UpdateOrdenServicioInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IOrdenServicioRepository } from "../domain/ports/orden-servicio.repository.js";
import type { ListOrdenesQuery } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createOrdenServicioHandlers(repo: IOrdenServicioRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListOrdenesQuery;
    const tenantId = c.get("tenantId");
    const result = await repo.list(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.estado !== undefined ? { estado: query.estado } : {}),
      ...(query.tecnico_id !== undefined ? { tecnico_id: query.tecnico_id } : {}),
      ...(query.sucursal_id !== undefined ? { sucursal_id: query.sucursal_id } : {}),
      ...(query.cliente_id !== undefined ? { cliente_id: query.cliente_id } : {}),
      ...(query.desde !== undefined ? { desde: query.desde } : {}),
      ...(query.hasta !== undefined ? { hasta: query.hasta } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
    });
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  }

  async function create(c: HonoCtx) {
    const body = c.req.valid("json") as CreateOrdenServicioInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const os = await repo.create(tenantId, {
      cliente_id: body.cliente_id,
      sucursal_id: body.sucursal_id,
      recibido_por_id: userId,
      categoria_id: body.categoria_id,
      ...(body.marca_id !== undefined ? { marca_id: body.marca_id } : {}),
      ...(body.modelo_id !== undefined ? { modelo_id: body.modelo_id } : {}),
      ...(body.serie_equipo !== undefined ? { serie_equipo: body.serie_equipo } : {}),
      ...(body.color_equipo !== undefined ? { color_equipo: body.color_equipo } : {}),
      problema_reportado: body.problema_reportado,
      ...(body.tipo_servicio !== undefined ? { tipo_servicio: body.tipo_servicio } : {}),
      ...(body.prioridad !== undefined ? { prioridad: body.prioridad } : {}),
      ...(body.notas_internas !== undefined ? { notas_internas: body.notas_internas } : {}),
    });
    return c.json({ success: true, data: os }, 201);
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const os = await repo.findById(tenantId, id);
    if (!os) throw new ApiError("OS_NOT_FOUND", "Orden de servicio no encontrada", 404);
    return c.json({ success: true, data: os });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateOrdenServicioInput;
    const tenantId = c.get("tenantId");
    const os = await repo.update(tenantId, id, {
      ...(body.tecnico_id !== undefined ? { tecnico_id: body.tecnico_id } : {}),
      ...(body.diagnostico_tecnico !== undefined
        ? { diagnostico_tecnico: body.diagnostico_tecnico }
        : {}),
      ...(body.solucion_aplicada !== undefined
        ? { solucion_aplicada: body.solucion_aplicada }
        : {}),
      ...(body.notas_internas !== undefined ? { notas_internas: body.notas_internas } : {}),
      ...(body.prioridad !== undefined ? { prioridad: body.prioridad } : {}),
    });
    if (!os) throw new ApiError("OS_NOT_FOUND", "Orden de servicio no encontrada", 404);
    return c.json({ success: true, data: os });
  }

  async function updateEstado(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateEstadoOrdenServicioInput;
    const tenantId = c.get("tenantId");
    try {
      const os = await repo.updateEstado(tenantId, id, {
        estado: body.estado,
        ...(body.notas !== undefined ? { notas: body.notas } : {}),
      });
      if (!os) throw new ApiError("OS_NOT_FOUND", "Orden de servicio no encontrada", 404);
      return c.json({ success: true, data: os });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("INVALID_TRANSITION", (err as Error).message, 422);
    }
  }

  async function listComponentes(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const items = await repo.listComponentes(tenantId, id);
    return c.json({ success: true, data: items });
  }

  async function addComponentes(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AddComponentesOrdenServicioInput;
    const tenantId = c.get("tenantId");
    const items = await repo.addComponentes(tenantId, id, body.items);
    return c.json({ success: true, data: items }, 201);
  }

  async function getCotizacion(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const items = await repo.listCotizacion(tenantId, id);
    const subtotal = items.reduce((acc, it) => acc + Number(it.subtotal), 0);
    const igv = subtotal * 0.18;
    const total = subtotal + igv;
    return c.json({
      success: true,
      data: items,
      totales: {
        subtotal: subtotal.toFixed(2),
        igv: igv.toFixed(2),
        total: total.toFixed(2),
      },
    });
  }

  async function addCotizacion(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AddCotizacionOrdenServicioInput;
    const tenantId = c.get("tenantId");
    const items = await repo.addCotizacion(tenantId, id, body.items);
    return c.json({ success: true, data: items }, 201);
  }

  async function aprobarCotizacion(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AprobarCotizacionInput;
    const tenantId = c.get("tenantId");
    const os = await repo.aprobarCotizacion(tenantId, id, body.aprobado);
    if (!os) throw new ApiError("OS_NOT_FOUND", "Orden de servicio no encontrada", 404);
    return c.json({ success: true, data: os });
  }

  async function getEvidencias(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const items = await repo.listEvidencias(tenantId, id);
    return c.json({ success: true, data: items });
  }

  async function addEvidencia(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as AddEvidenciaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const ev = await repo.addEvidencia(tenantId, id, {
      url: body.url,
      tipo_archivo: body.tipo_archivo,
      momento: body.momento,
      ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
      usuario_id: userId,
    });
    return c.json({ success: true, data: ev }, 201);
  }

  async function deleteEvidencia(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const evidenciaId = c.req.param("evidenciaId") as string;
    const tenantId = c.get("tenantId");
    const deleted = await repo.deleteEvidencia(tenantId, id, evidenciaId);
    if (!deleted) throw new ApiError("EVIDENCIA_NOT_FOUND", "Evidencia no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  return {
    list,
    create,
    getById,
    update,
    updateEstado,
    listComponentes,
    addComponentes,
    getCotizacion,
    addCotizacion,
    aprobarCotizacion,
    getEvidencias,
    addEvidencia,
    deleteEvidencia,
  };
}
