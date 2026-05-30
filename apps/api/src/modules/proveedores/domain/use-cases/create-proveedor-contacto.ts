import type { CreateProveedorContactoInput } from "@kallpasoft/validators";
import type { ProveedorContacto } from "../entities/proveedor.js";
import type {
  CreateProveedorContactoData,
  IProveedorRepository,
} from "../ports/proveedor.repository.js";

export async function createProveedorContacto(
  repo: IProveedorRepository,
  tenantId: string,
  proveedorId: string,
  input: CreateProveedorContactoInput
): Promise<ProveedorContacto> {
  const data: CreateProveedorContactoData = {
    nombre: input.nombre,
    es_principal: input.es_principal,
    ...(input.cargo !== undefined ? { cargo: input.cargo } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
  };
  return repo.createContacto(tenantId, proveedorId, data);
}
