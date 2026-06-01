import type { AbrirCajaInput, CerrarCajaInput, ListCajasQuery } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { ICajaRepository } from "../domain/ports/caja.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createCajaHandlers(repo: ICajaRepository) {
  async function list(c: HonoCtx) {
    const q = c.req.valid("query") as ListCajasQuery;
    const tenantId = c.get("tenantId");
    const result = await repo.list(tenantId, {
      page: q.page,
      pageSize: q.pageSize,
      ...(q.sucursal_id !== undefined ? { sucursal_id: q.sucursal_id } : {}),
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

  async function activa(c: HonoCtx) {
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");
    const caja = await repo.findActual(tenantId, userId);
    return c.json({ success: true, data: caja });
  }

  async function apertura(c: HonoCtx) {
    const body = c.req.valid("json") as AbrirCajaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");

    const existing = await repo.findActual(tenantId, userId);
    if (existing) throw new ApiError("CAJA_YA_ABIERTA", "Ya tienes una caja abierta", 409);

    const caja = await repo.abrir(tenantId, {
      sucursal_id: body.sucursal_id,
      usuario_id: userId,
      monto_inicial: body.monto_inicial,
    });
    return c.json({ success: true, data: caja }, 201);
  }

  async function cierre(c: HonoCtx) {
    const body = c.req.valid("json") as CerrarCajaInput;
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");

    const cajaActual = await repo.findActual(tenantId, userId);
    if (!cajaActual || cajaActual.id !== body.caja_id) {
      throw new ApiError("CAJA_NO_AUTORIZADA", "No tienes una caja abierta con ese ID", 403);
    }

    try {
      const caja = await repo.cerrar(tenantId, body.caja_id, {
        monto_fisico: body.monto_fisico,
      });
      if (!caja) throw new ApiError("CAJA_NOT_FOUND", "Caja no encontrada", 404);
      return c.json({ success: true, data: caja });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("CIERRE_ERROR", (err as Error).message, 422);
    }
  }

  async function reporte(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const data = await repo.reporte(tenantId, id);
    if (!data) throw new ApiError("CAJA_NOT_FOUND", "Caja no encontrada", 404);
    return c.json({ success: true, data });
  }

  return { list, activa, apertura, cierre, reporte };
}
