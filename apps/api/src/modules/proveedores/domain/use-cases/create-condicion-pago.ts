import type { CreateCondicionPagoInput } from "@kallpasoft/validators";
import type { CondicionPago } from "../entities/proveedor.js";
import type {
  CreateCondicionPagoData,
  IProveedorRepository,
} from "../ports/proveedor.repository.js";

export async function createCondicionPago(
  repo: IProveedorRepository,
  tenantId: string,
  input: CreateCondicionPagoInput
): Promise<CondicionPago> {
  const data: CreateCondicionPagoData = {
    nombre: input.nombre,
    ...(input.dias_credito !== undefined ? { dias_credito: input.dias_credito } : {}),
    ...(input.es_default !== undefined ? { es_default: input.es_default } : {}),
  };
  return repo.createCondicionPago(tenantId, data);
}
