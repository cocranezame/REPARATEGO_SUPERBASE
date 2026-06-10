import type { CreateTipoRepuestoInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { isDuplicateKeyError } from "../../../lib/db-errors.js";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type {
  ITipoRepuestoRepository,
  ListTiposRepuestoParams,
} from "../domain/ports/tipo-repuesto.repository.js";
import { createTipoRepuesto } from "../domain/use-cases/create-tipo-repuesto.js";
import { deleteTipoRepuesto } from "../domain/use-cases/delete-tipo-repuesto.js";
import { getTipoRepuestoById } from "../domain/use-cases/get-tipo-repuesto-by-id.js";
import { listTiposRepuesto } from "../domain/use-cases/list-tipos-repuesto.js";
import type { UpdateTipoRepuestoInput } from "../domain/use-cases/update-tipo-repuesto.js";
import { updateTipoRepuesto } from "../domain/use-cases/update-tipo-repuesto.js";
import type { ListTiposRepuestoQuery } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createTipoRepuestoHandlers(repo: ITipoRepuestoRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListTiposRepuestoQuery;
    const tenantId = c.get("tenantId");
    const params: ListTiposRepuestoParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.componente_id !== undefined ? { componente_id: query.componente_id } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };
    const result = await listTiposRepuesto(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateTipoRepuestoInput;
    const tenantId = c.get("tenantId");
    try {
      const tipo = await createTipoRepuesto(repo, tenantId, body);
      return c.json({ success: true, data: tipo }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_TIPO_REPUESTO",
          "Tipo ya registrado para este componente",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const tipo = await getTipoRepuestoById(repo, tenantId, id);
    if (!tipo) throw new ApiError("TIPO_REPUESTO_NOT_FOUND", "Tipo no encontrado", 404);
    return c.json({ success: true, data: tipo });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateTipoRepuestoInput;
    const tenantId = c.get("tenantId");
    try {
      const tipo = await updateTipoRepuesto(repo, tenantId, id, body);
      if (!tipo) throw new ApiError("TIPO_REPUESTO_NOT_FOUND", "Tipo no encontrado", 404);
      return c.json({ success: true, data: tipo });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_TIPO_REPUESTO",
          "Tipo ya registrado para este componente",
          409
        );
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteTipoRepuesto(repo, tenantId, id);
    if (!deleted) throw new ApiError("TIPO_REPUESTO_NOT_FOUND", "Tipo no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
