import type { UpdateCondicionPagoInput } from "@kallpasoft/validators";
import type { CondicionPago } from "../entities/proveedor.js";
import type {
  IProveedorRepository,
  UpdateCondicionPagoData,
} from "../ports/proveedor.repository.js";

export type { UpdateCondicionPagoInput };

export async function updateCondicionPago(
  repo: IProveedorRepository,
  tenantId: string,
  id: string,
  input: UpdateCondicionPagoInput
): Promise<CondicionPago | null> {
  const data: UpdateCondicionPagoData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.dias_credito !== undefined ? { dias_credito: input.dias_credito } : {}),
    ...(input.es_default !== undefined ? { es_default: input.es_default } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.updateCondicionPago(tenantId, id, data);
}
