import type { CreateComponenteInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { isDuplicateKeyError } from "../../../lib/db-errors.js";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type {
  IComponenteRepository,
  ListComponentesParams,
} from "../domain/ports/componente.repository.js";
import { createComponente } from "../domain/use-cases/create-componente.js";
import { deleteComponente } from "../domain/use-cases/delete-componente.js";
import { getComponenteById } from "../domain/use-cases/get-componente-by-id.js";
import { listComponentes } from "../domain/use-cases/list-componentes.js";
import type { UpdateComponenteInput } from "../domain/use-cases/update-componente.js";
import { updateComponente } from "../domain/use-cases/update-componente.js";
import type { ListComponentesQuery, UpdateComponenteHttpInput } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export function createComponenteHandlers(repo: IComponenteRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListComponentesQuery;
    const tenantId = c.get("tenantId");

    const params: ListComponentesParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.categoria_id !== undefined ? { categoria_id: query.categoria_id } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };

    const result = await listComponentes(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateComponenteInput;
    const tenantId = c.get("tenantId");
    try {
      const componente = await createComponente(repo, tenantId, body);
      return c.json({ success: true, data: componente }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_COMPONENTE",
          "Nombre de componente ya registrado para esta categoría",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const componente = await getComponenteById(repo, tenantId, id);
    if (!componente) throw new ApiError("COMPONENTE_NOT_FOUND", "Componente no encontrado", 404);
    return c.json({ success: true, data: componente });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateComponenteHttpInput;
    const tenantId = c.get("tenantId");
    const input: UpdateComponenteInput = {
      ...(body.categoria_id !== undefined ? { categoria_id: body.categoria_id } : {}),
      ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
      ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
    };
    try {
      const componente = await updateComponente(repo, tenantId, id, input);
      if (!componente) throw new ApiError("COMPONENTE_NOT_FOUND", "Componente no encontrado", 404);
      return c.json({ success: true, data: componente });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_COMPONENTE",
          "Nombre de componente ya registrado para esta categoría",
          409
        );
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteComponente(repo, tenantId, id);
    if (!deleted) throw new ApiError("COMPONENTE_NOT_FOUND", "Componente no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
