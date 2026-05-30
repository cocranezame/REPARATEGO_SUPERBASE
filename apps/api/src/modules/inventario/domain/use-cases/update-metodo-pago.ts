import type { UpdateMetodoPagoInput } from "@kallpasoft/validators";
import type { MetodoPagoCatalogo } from "../entities/metodo-pago-catalogo.js";
import type {
  IMetodoPagoRepository,
  UpdateMetodoPagoData,
} from "../ports/metodo-pago.repository.js";

export type { UpdateMetodoPagoInput };

export async function updateMetodoPago(
  repo: IMetodoPagoRepository,
  tenantId: string,
  id: string,
  input: UpdateMetodoPagoInput
): Promise<MetodoPagoCatalogo | null> {
  const data: UpdateMetodoPagoData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
