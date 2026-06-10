import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { ICotizacionCompraRepository } from "../domain/ports/cotizacion-compra.repository.js";
import { createCotizacionCompra } from "../domain/use-cases/create-cotizacion-compra.js";
import { deleteCotizacionCompra } from "../domain/use-cases/delete-cotizacion-compra.js";
import { getCotizacionCompraById } from "../domain/use-cases/get-cotizacion-compra-by-id.js";
import { listCotizacionesCompra } from "../domain/use-cases/list-cotizaciones-compra.js";
import { updateCotizacionCompra } from "../domain/use-cases/update-cotizacion-compra.js";
import type {
  CreateCotizacionCompraHttpInput,
  ListCotizacionesQuery,
  UpdateCotizacionCompraHttpInput,
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
      ...(query.producto_id !== undefined ? { producto_id: query.producto_id } : {}),
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

    try {
      const cotizacion = await createCotizacionCompra(repo, tenantId, {
        proveedor_id: body.proveedor_id,
        producto_id: body.producto_id,
        ...(body.precio_unitario !== undefined ? { precio_unitario: body.precio_unitario } : {}),
        ...(body.notas !== undefined ? { notas: body.notas } : {}),
      });
      return c.json({ success: true, data: cotizacion }, 201);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "23505") {
        throw new ApiError(
          "COTIZACION_DUPLICATE",
          "Ya existe una cotización para este proveedor y repuesto",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const cotizacion = await getCotizacionCompraById(repo, tenantId, id);
    if (!cotizacion) throw new ApiError("COTIZACION_NOT_FOUND", "Cotización no encontrada", 404);
    return c.json({ success: true, data: cotizacion });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateCotizacionCompraHttpInput;
    const tenantId = c.get("tenantId");

    const cotizacion = await updateCotizacionCompra(repo, tenantId, id, {
      ...(body.precio_unitario !== undefined ? { precio_unitario: body.precio_unitario } : {}),
      ...(body.notas !== undefined ? { notas: body.notas } : {}),
    });
    if (!cotizacion) throw new ApiError("COTIZACION_NOT_FOUND", "Cotización no encontrada", 404);
    return c.json({ success: true, data: cotizacion });
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteCotizacionCompra(repo, tenantId, id);
    if (!deleted) throw new ApiError("COTIZACION_NOT_FOUND", "Cotización no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  async function getWhatsapp(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    try {
      const result = await repo.getWhatsapp(tenantId, id);
      return c.json({ success: true, data: result });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("no encontrada") || msg.includes("no tiene teléfono")) {
        throw new ApiError("WHATSAPP_ERROR", msg, 422);
      }
      throw err;
    }
  }

  return { list, create, getById, update, remove, getWhatsapp };
}
