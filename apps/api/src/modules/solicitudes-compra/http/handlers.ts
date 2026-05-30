import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { ISolicitudCompraRepository } from "../domain/ports/solicitud-compra.repository.js";
import type {
  CreateSolicitudHttpInput,
  ListSolicitudesQuery,
  UpdateSolicitudHttpInput,
} from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createSolicitudCompraHandlers(repo: ISolicitudCompraRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListSolicitudesQuery;
    const tenantId = c.get("tenantId");

    const result = await repo.list(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.estado !== undefined ? { estado: query.estado } : {}),
      ...(query.prioridad !== undefined ? { prioridad: query.prioridad } : {}),
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
    const body = c.req.valid("json") as CreateSolicitudHttpInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");

    const solicitud = await repo.create(tenantId, {
      producto_id: body.producto_id,
      cantidad_solicitada: body.cantidad_solicitada,
      usuario_id: usuarioId,
      ...(body.prioridad !== undefined ? { prioridad: body.prioridad } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });

    return c.json({ success: true, data: solicitud }, 201);
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateSolicitudHttpInput;
    const tenantId = c.get("tenantId");

    const solicitud = await repo.update(tenantId, id, body);
    if (!solicitud)
      throw new ApiError(
        "SOLICITUD_NOT_FOUND",
        "Solicitud no encontrada o no está en estado PENDIENTE",
        404
      );
    return c.json({ success: true, data: solicitud });
  }

  async function deleteSolicitud(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");

    const ok = await repo.delete(tenantId, id);
    if (!ok)
      throw new ApiError(
        "SOLICITUD_NOT_FOUND",
        "Solicitud no encontrada o no se puede eliminar",
        404
      );
    return c.json({ success: true });
  }

  async function stockBajo(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const rows = await repo.listStockBajo(tenantId);
    return c.json({ success: true, data: rows });
  }

  return { list, create, update, deleteSolicitud, stockBajo };
}
