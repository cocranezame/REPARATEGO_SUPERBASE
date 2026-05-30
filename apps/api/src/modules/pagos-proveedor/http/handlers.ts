import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IPagoProveedorRepository } from "../domain/ports/pago-proveedor.repository.js";
import type { CreatePagoProveedorInput, ListPagosProveedorQuery } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createPagoProveedorHandlers(repo: IPagoProveedorRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListPagosProveedorQuery;
    const tenantId = c.get("tenantId");

    const result = await repo.list(tenantId, {
      page: query.page,
      pageSize: query.pageSize,
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

  async function create(c: HonoCtx) {
    const body = c.req.valid("json") as CreatePagoProveedorInput;
    const tenantId = c.get("tenantId");
    const usuarioId = c.get("userId");

    try {
      const pago = await repo.create(tenantId, {
        orden_compra_id: body.orden_compra_id,
        monto: body.monto,
        metodo_pago: body.metodo_pago,
        fecha_pago: body.fecha_pago,
        usuario_id: usuarioId,
        ...(body.referencia !== undefined ? { referencia: body.referencia } : {}),
        ...(body.comprobante_url !== undefined ? { comprobante_url: body.comprobante_url } : {}),
        ...(body.notas !== undefined ? { notas: body.notas } : {}),
      });

      return c.json({ success: true, data: pago }, 201);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el pago";
      throw new ApiError("PAGO_ERROR", msg, 422);
    }
  }

  return { list, create };
}
