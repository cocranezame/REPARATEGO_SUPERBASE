import type { CreateCategoriaInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type {
  ICategoriaRepository,
  ListCategoriasParams,
} from "../domain/ports/categoria.repository.js";
import { createCategoria } from "../domain/use-cases/create-categoria.js";
import { deleteCategoria } from "../domain/use-cases/delete-categoria.js";
import { getCategoriaById } from "../domain/use-cases/get-categoria-by-id.js";
import { listCategorias } from "../domain/use-cases/list-categorias.js";
import type { UpdateCategoriaInput } from "../domain/use-cases/update-categoria.js";
import { updateCategoria } from "../domain/use-cases/update-categoria.js";
import type { ListCategoriasQuery, UpdateCategoriaHttpInput } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

export function createCategoriaHandlers(repo: ICategoriaRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListCategoriasQuery;
    const tenantId = c.get("tenantId");

    const params: ListCategoriasParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
      ...(query.padre_id !== undefined ? { padre_id: query.padre_id } : {}),
      ...(query.incluir_hijos !== undefined ? { incluir_hijos: query.incluir_hijos } : {}),
    };

    const result = await listCategorias(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateCategoriaInput;
    const tenantId = c.get("tenantId");
    try {
      const categoria = await createCategoria(repo, tenantId, body);
      return c.json({ success: true, data: categoria }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_CATEGORIA",
          "Nombre de categoría ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const categoria = await getCategoriaById(repo, tenantId, id);
    if (!categoria) throw new ApiError("CATEGORIA_NOT_FOUND", "Categoría no encontrada", 404);
    return c.json({ success: true, data: categoria });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateCategoriaHttpInput;
    const tenantId = c.get("tenantId");
    const input: UpdateCategoriaInput = {
      ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
      ...(body.descripcion !== undefined ? { descripcion: body.descripcion } : {}),
      ...(body.categoria_padre_id !== undefined
        ? { categoria_padre_id: body.categoria_padre_id }
        : {}),
      ...(body.orden !== undefined ? { orden: body.orden } : {}),
    };
    try {
      const categoria = await updateCategoria(repo, tenantId, id, input);
      if (!categoria) throw new ApiError("CATEGORIA_NOT_FOUND", "Categoría no encontrada", 404);
      return c.json({ success: true, data: categoria });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_CATEGORIA",
          "Nombre de categoría ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteCategoria(repo, tenantId, id);
    if (!deleted) throw new ApiError("CATEGORIA_NOT_FOUND", "Categoría no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
