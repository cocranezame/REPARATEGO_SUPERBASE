import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IOrdenCompraRepository } from "../domain/ports/orden-compra.repository.js";
import type {
  ConfirmarOrdenHttpInput,
  GenerarOrdenHttpInput,
  ListOrdenesQuery,
  UpdateEstadoHttpInput,
} from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createOrdenCompraHandlers(repo: IOrdenCompraRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListOrdenesQuery;
    const tenantId = c.get("tenantId");

    const result = await repo.list(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.estado !== undefined ? { estado: query.estado } : {}),
      ...(query.proveedor_id !== undefined ? { proveedor_id: query.proveedor_id } : {}),
      ...(query.desde !== undefined ? { desde: query.desde } : {}),
      ...(query.hasta !== undefined ? { hasta: query.hasta } : {}),
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

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const orden = await repo.findById(tenantId, id);
    if (!orden) throw new ApiError("ORDEN_NOT_FOUND", "Orden de compra no encontrada", 404);
    return c.json({ success: true, data: orden });
  }

  async function generar(c: HonoCtx) {
    const body = c.req.valid("json") as GenerarOrdenHttpInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");

    const orden = await repo.generar(tenantId, {
      proveedor_id: body.proveedor_id,
      solicitud_ids: body.solicitud_ids,
      items: body.items,
      usuario_id: usuarioId,
      ...(body.fecha_entrega_estimada !== undefined
        ? { fecha_entrega_estimada: body.fecha_entrega_estimada }
        : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });

    return c.json({ success: true, data: orden }, 201);
  }

  async function updateEstado(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateEstadoHttpInput;
    const tenantId = c.get("tenantId");

    const orden = await repo.updateEstado(tenantId, id, body.estado);
    if (!orden)
      throw new ApiError(
        "ORDEN_TRANSITION_INVALID",
        "Orden no encontrada o transición de estado inválida",
        422
      );
    return c.json({ success: true, data: orden });
  }

  async function confirmar(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as ConfirmarOrdenHttpInput;
    const tenantId = c.get("tenantId");

    const orden = await repo.confirmar(tenantId, id, body.items);
    if (!orden)
      throw new ApiError(
        "ORDEN_NOT_FOUND",
        "Orden no encontrada o no está en estado TERMINADA",
        422
      );
    return c.json({ success: true, data: orden });
  }

  return { list, getById, generar, updateEstado, confirmar };
}
