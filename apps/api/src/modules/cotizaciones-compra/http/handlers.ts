import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { ICotizacionCompraRepository } from "../domain/ports/cotizacion-compra.repository.js";
import { cotizarCotizacionCompra } from "../domain/use-cases/cotizar-cotizacion-compra.js";
import { createCotizacionCompra } from "../domain/use-cases/create-cotizacion-compra.js";
import { getCotizacionCompraById } from "../domain/use-cases/get-cotizacion-compra-by-id.js";
import { listCotizacionesCompra } from "../domain/use-cases/list-cotizaciones-compra.js";
import type {
  CotizarCotizacionHttpInput,
  CreateCotizacionCompraHttpInput,
  ListCotizacionesQuery,
} from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createCotizacionCompraHandlers(repo: ICotizacionCompraRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListCotizacionesQuery;
    const tenantId = c.get("tenantId");

    const result = await listCotizacionesCompra(repo, tenantId, {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.proveedor_id !== undefined ? { proveedor_id: query.proveedor_id } : {}),
      ...(query.estado !== undefined ? { estado: query.estado } : {}),
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
    const body = c.req.valid("json") as CreateCotizacionCompraHttpInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");

    const cotizacion = await createCotizacionCompra(repo, tenantId, {
      proveedor_id: body.proveedor_id,
      usuario_id: usuarioId,
      items: body.items,
      ...(body.fecha_vencimiento !== undefined
        ? { fecha_vencimiento: body.fecha_vencimiento }
        : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });

    return c.json({ success: true, data: cotizacion }, 201);
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const cotizacion = await getCotizacionCompraById(repo, tenantId, id);
    if (!cotizacion) throw new ApiError("COTIZACION_NOT_FOUND", "Cotización no encontrada", 404);
    return c.json({ success: true, data: cotizacion });
  }

  async function cotizar(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as CotizarCotizacionHttpInput;
    const tenantId = c.get("tenantId");

    const cotizacion = await cotizarCotizacionCompra(repo, tenantId, id, body.items);
    if (!cotizacion)
      throw new ApiError(
        "COTIZACION_NOT_FOUND",
        "Cotización no encontrada o no está en estado PENDIENTE",
        404
      );
    return c.json({ success: true, data: cotizacion });
  }

  return { list, create, getById, cotizar };
}
