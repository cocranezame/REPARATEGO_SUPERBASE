import type { CreateProveedorMetodoPagoInput } from "@kallpasoft/validators";
import type { ProveedorMetodoPago } from "../entities/proveedor.js";
import type {
  CreateProveedorMetodoPagoData,
  IProveedorRepository,
} from "../ports/proveedor.repository.js";

export async function createProveedorMetodoPago(
  repo: IProveedorRepository,
  tenantId: string,
  proveedorId: string,
  input: CreateProveedorMetodoPagoInput
): Promise<ProveedorMetodoPago> {
  const data: CreateProveedorMetodoPagoData = {
    tipo: input.tipo,
    ...(input.banco !== undefined ? { banco: input.banco } : {}),
    ...(input.numero_cuenta !== undefined ? { numero_cuenta: input.numero_cuenta } : {}),
    ...(input.cci !== undefined ? { cci: input.cci } : {}),
    ...(input.titular !== undefined ? { titular: input.titular } : {}),
  };
  return repo.createMetodoPago(tenantId, proveedorId, data);
}
