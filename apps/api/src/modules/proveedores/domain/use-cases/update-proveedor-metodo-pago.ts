import type { UpdateProveedorMetodoPagoInput } from "@kallpasoft/validators";
import type { ProveedorMetodoPago } from "../entities/proveedor.js";
import type {
  IProveedorRepository,
  UpdateProveedorMetodoPagoData,
} from "../ports/proveedor.repository.js";

export type { UpdateProveedorMetodoPagoInput };

export async function updateProveedorMetodoPago(
  repo: IProveedorRepository,
  tenantId: string,
  id: string,
  proveedorId: string,
  input: UpdateProveedorMetodoPagoInput
): Promise<ProveedorMetodoPago | null> {
  const data: UpdateProveedorMetodoPagoData = {
    ...(input.tipo !== undefined ? { tipo: input.tipo } : {}),
    ...(input.banco !== undefined ? { banco: input.banco } : {}),
    ...(input.numero_cuenta !== undefined ? { numero_cuenta: input.numero_cuenta } : {}),
    ...(input.cci !== undefined ? { cci: input.cci } : {}),
    ...(input.titular !== undefined ? { titular: input.titular } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.updateMetodoPago(tenantId, id, proveedorId, data);
}
