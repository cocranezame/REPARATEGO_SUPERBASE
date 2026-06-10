import { ApiError } from "../../../../middlewares/error-handler.js";
import type { IProductoRepository } from "../ports/producto.repository.js";

const FK_VIOLATION = "23503";

export async function deleteProducto(
  repo: IProductoRepository,
  tenantId: string,
  id: string
): Promise<boolean> {
  const { hasCotizaciones } = await repo.hasDependencies(tenantId, id);
  if (hasCotizaciones) {
    throw new ApiError(
      "PRODUCTO_HAS_DEPENDENCIES",
      "No se puede eliminar: el repuesto tiene registros asociados. Puedes desactivarlo en cambio.",
      409
    );
  }
  try {
    return await repo.hardDelete(tenantId, id);
  } catch (err: unknown) {
    const e = err as { cause?: { code?: string }; code?: string };
    const cause = e?.cause;
    if (cause?.code === FK_VIOLATION || e?.code === FK_VIOLATION) {
      throw new ApiError(
        "PRODUCTO_HAS_DEPENDENCIES",
        "No se puede eliminar: el repuesto tiene registros asociados. Puedes desactivarlo en cambio.",
        409
      );
    }
    throw err;
  }
}
