import type { CreateMarcaInput } from "@kallpasoft/validators";
import type { Context } from "hono";
import { ApiError } from "../../../middlewares/error-handler.js";
import type { HonoVariables } from "../../../types/context.js";
import type { IMarcaRepository, ListMarcasParams } from "../domain/ports/marca.repository.js";
import { createMarca } from "../domain/use-cases/create-marca.js";
import { deleteMarca } from "../domain/use-cases/delete-marca.js";
import { getMarcaById } from "../domain/use-cases/get-marca-by-id.js";
import { listMarcas } from "../domain/use-cases/list-marcas.js";
import type { UpdateMarcaInput } from "../domain/use-cases/update-marca.js";
import { updateMarca } from "../domain/use-cases/update-marca.js";
import type { ListMarcasQuery, UpdateMarcaHttpInput } from "./validators.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono's Input generic doesn't compose well with separately-defined handlers
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

function isDuplicateKeyError(err: unknown): boolean {
  return (err as { code?: string })?.code === "23505";
}

export function createMarcaHandlers(repo: IMarcaRepository) {
  async function list(c: HonoCtx) {
    const query = c.req.valid("query") as ListMarcasQuery;
    const tenantId = c.get("tenantId");

    const params: ListMarcasParams = {
      page: query.page,
      pageSize: query.pageSize,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.activo !== undefined ? { activo: query.activo } : {}),
    };

    const result = await listMarcas(repo, tenantId, params);
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
    const body = c.req.valid("json") as CreateMarcaInput;
    const tenantId = c.get("tenantId");
    try {
      const marca = await createMarca(repo, tenantId, body);
      return c.json({ success: true, data: marca }, 201);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_MARCA",
          "Nombre de marca ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function getById(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const marca = await getMarcaById(repo, tenantId, id);
    if (!marca) throw new ApiError("MARCA_NOT_FOUND", "Marca no encontrada", 404);
    return c.json({ success: true, data: marca });
  }

  async function update(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const body = c.req.valid("json") as UpdateMarcaHttpInput;
    const tenantId = c.get("tenantId");
    const input: UpdateMarcaInput = {
      ...(body.nombre !== undefined ? { nombre: body.nombre } : {}),
      ...(body.logo_url !== undefined ? { logo_url: body.logo_url } : {}),
    };
    try {
      const marca = await updateMarca(repo, tenantId, id, input);
      if (!marca) throw new ApiError("MARCA_NOT_FOUND", "Marca no encontrada", 404);
      return c.json({ success: true, data: marca });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (isDuplicateKeyError(err)) {
        throw new ApiError(
          "DUPLICATE_MARCA",
          "Nombre de marca ya registrado para este tenant",
          409
        );
      }
      throw err;
    }
  }

  async function remove(c: HonoCtx) {
    const id = c.req.param("id") as string;
    const tenantId = c.get("tenantId");
    const deleted = await deleteMarca(repo, tenantId, id);
    if (!deleted) throw new ApiError("MARCA_NOT_FOUND", "Marca no encontrada", 404);
    return c.json({ success: true, data: null });
  }

  return { list, create, getById, update, remove };
}
