import type { UpdateProveedorContactoInput } from "@kallpasoft/validators";
import type { ProveedorContacto } from "../entities/proveedor.js";
import type {
  IProveedorRepository,
  UpdateProveedorContactoData,
} from "../ports/proveedor.repository.js";

export type { UpdateProveedorContactoInput };

export async function updateProveedorContacto(
  repo: IProveedorRepository,
  tenantId: string,
  id: string,
  proveedorId: string,
  input: UpdateProveedorContactoInput
): Promise<ProveedorContacto | null> {
  const data: UpdateProveedorContactoData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.cargo !== undefined ? { cargo: input.cargo } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.es_principal !== undefined ? { es_principal: input.es_principal } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.updateContacto(tenantId, id, proveedorId, data);
}
