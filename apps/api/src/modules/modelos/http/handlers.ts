import type { CreateModeloInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IModeloRepository, ListModelosParams } from "../domain/ports/modelo.repository.js";
import { createModelo } from "../domain/use-cases/create-modelo.js";
import { deleteModelo } from "../domain/use-cases/delete-modelo.js";
import { getModeloById } from "../domain/use-cases/get-modelo-by-id.js";
import { listModelos } from "../domain/use-cases/list-modelos.js";
import type { UpdateModeloInput } from "../domain/use-cases/update-modelo.js";
import { updateModelo } from "../domain/use-cases/update-modelo.js";
import type { ListModelosQuery, UpdateModeloHttpInput } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

export function createModeloHandlers(repo: IModeloRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListModelosQuery;
    const tenantId = c.get("tenantId");

    const params: ListModelosParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.marca_id !== undefined ? { marca_id: query.marca_id } : {}),
      ...(query.categoria_id !== undefined ? { categoria_id: query.categoria_id } : {}),
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };

    const result = await listModelos(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateModeloInput;
    const tenantId = c.get("tenantId");
    try {
      const modelo = await createModelo(repo, tenantId, body);
      return c.json({ success: true, data: modelo }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_MODELO",
          "Nombre de modelo ya registrado para esta marca",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const modelo = await getModeloById(repo, tenantId, id);
    if (!modelo) throw new ApiError("MODELO_NOT_FOUND", "Modelo no encontrado", 404);
    return c.json({ success: true, data: modelo });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateModeloHttpInput;
    const tenantId = c.get("tenantId");
    const input: UpdateModeloInput = {
      ...(body.marca_id !== undefined ? { marca_id: body.marca_id } : {}),
      ...(body.categoria_id !== undefined ? { categoria_id: body.categoria_id } : {}),
      ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
    };
    try {
      const modelo = await updateModelo(repo, tenantId, id, input);
      if (!modelo) throw new ApiError("MODELO_NOT_FOUND", "Modelo no encontrado", 404);
      return c.json({ success: true, data: modelo });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_MODELO",
          "Nombre de modelo ya registrado para esta marca",
          409
        );
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteModelo(repo, tenantId, id);
    if (!deleted) throw new ApiError("MODELO_NOT_FOUND", "Modelo no encontrado", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
