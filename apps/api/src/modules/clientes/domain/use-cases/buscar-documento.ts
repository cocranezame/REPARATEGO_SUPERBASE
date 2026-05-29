import type { TipoDocumento } from "@kallpasoft/shared";
import type { Cliente } from "../entities/cliente.js";
import type { IClienteRepository } from "../ports/cliente.repository.js";

export async function buscarClientePorDocumento(
  repo: IClienteRepository,
  tenantId: string,
  tipo: TipoDocumento,
  numero: string
): Promise<Cliente | null> {
  return repo.findByDocumento(tenantId, tipo, numero);
}
