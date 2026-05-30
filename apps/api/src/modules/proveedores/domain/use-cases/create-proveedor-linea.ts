import type { CreateProveedorLineaInput } from "@kallpasoft/validators";
import type { ProveedorLinea } from "../entities/proveedor.js";
import type {
  CreateProveedorLineaData,
  IProveedorRepository,
} from "../ports/proveedor.repository.js";

export async function createProveedorLinea(
  repo: IProveedorRepository,
  tenantId: string,
  proveedorId: string,
  input: CreateProveedorLineaInput
): Promise<ProveedorLinea> {
  const data: CreateProveedorLineaData = {
    ...(input.categoria_id !== undefined ? { categoria_id: input.categoria_id } : {}),
    ...(input.componente_id !== undefined ? { componente_id: input.componente_id } : {}),
    ...(input.descripcion !== undefined ? { descripcion: input.descripcion } : {}),
  };
  return repo.createLinea(tenantId, proveedorId, data);
}
