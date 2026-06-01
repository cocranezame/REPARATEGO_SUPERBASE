import type {
  CreateCotizacionVentaInput,
  ListCotizacionesVentaQuery,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { ICotizacionVentaRepository } from "../domain/ports/cotizacion-venta.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createCotizacionVentaHandlers(repo: ICotizacionVentaRepository) {
  async function list(c: HonoCtx) {
    const q = c.req.valid("query") as ListCotizacionesVentaQuery;
    const tenantId = c.get("tenantId");
    const result = await repo.list(tenantId, {
      page: q.page,
      pageSize: q.pageSize,
      ...(q.cliente_id !== undefined ? { cliente_id: q.cliente_id } : {}),
      ...(q.fecha_desde !== undefined ? { fecha_desde: q.fecha_desde } : {}),
      ...(q.fecha_hasta !== undefined ? { fecha_hasta: q.fecha_hasta } : {}),
    });
    return c.json({
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: q.page,
        pageSize: q.pageSize,
        totalPages: Math.ceil(result.total / q.pageSize),
      },
    });
  }

  async function create(c: HonoCtx) {
    const body = c.req.valid("json") as CreateCotizacionVentaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const cajaId = c.get("cajaId");

    if (!cajaId) throw new ApiError("CAJA_CERRADA", "No hay caja abierta", 403);

    const cot = await repo.create(tenantId, {
      caja_id: cajaId,
      created_by: userId,
      ...(body.cliente_id !== undefined ? { cliente_id: body.cliente_id } : {}),
      items: body.items.map((it) => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        ...(it.produto_id !== undefined ? { produto_id: it.produto_id } : {}),
      })),
    });
    return c.json({ success: true, data: cot }, 201);
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const cot = await repo.findById(tenantId, id);
    if (!cot) throw new ApiError("COTIZACION_NOT_FOUND", "Cotización no encontrada", 404);
    return c.json({ success: true, data: cot });
  }

  return { list, create, getById };
}
