import type {
  CreateCotizacionVentaInput,
  UpdateCotizacionVentaEstadoInput,
} from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { ICotizacionVentaRepository } from "../domain/ports/cotizacion-venta.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createCotizacionVentaHandlers(repo: ICotizacionVentaRepository) {
  async function list(c: HonoCtx) {
    const q = c.req.valid("query") as {
      cliente_id?: string;
      estado?: string;
      page: number;
      pageSize: number;
    };
    const tenantId = c.get("tenantId");
    const result = await repo.list(tenantId, {
      page: q.page,
      pageSize: q.pageSize,
      ...(q.cliente_id !== undefined ? { cliente_id: q.cliente_id } : {}),
      ...(q.estado !== undefined ? { estado: q.estado } : {}),
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
    const cot = await repo.create(tenantId, {
      usuario_id: userId,
      ...(body.cliente_id !== undefined ? { cliente_id: body.cliente_id } : {}),
      items: body.items.map((it) => ({
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        precio_unitario: it.precio_unitario,
        ...(it.producto_id !== undefined ? { producto_id: it.producto_id } : {}),
      })),
      ...(body.fecha_vencimiento !== undefined
        ? { fecha_vencimiento: body.fecha_vencimiento }
        : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
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

  async function updateEstado(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateCotizacionVentaEstadoInput;
    const tenantId = c.get("tenantId");
    const cot = await repo.updateEstado(tenantId, id, body.estado);
    if (!cot) throw new ApiError("COTIZACION_NOT_FOUND", "Cotización no encontrada", 404);
    return c.json({ success: true, data: cot });
  }

  return { list, create, getById, updateEstado };
}
