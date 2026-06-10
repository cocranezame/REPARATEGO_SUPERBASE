import type { CreateClienteInput } from "@kallpasoft/validators";
import type { Cliente } from "../entities/cliente.js";
import type { CreateClienteData, IClienteRepository } from "../ports/cliente.repository.js";

export async function createCliente(
  repo: IClienteRepository,
  tenantId: string,
  input: CreateClienteInput
): Promise<Cliente> {
  const base: CreateClienteData = {
    tipo_documento: input.tipo_documento,
    numero_documento: input.numero_documento,
    tipo_persona: input.tipo_persona,
    ...(input.tipo_persona === "NATURAL"
      ? { nombres: input.nombres, apellidos: input.apellidos }
      : { razon_social: input.razon_social }),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.telefono_secundario !== undefined
      ? { telefono_secundario: input.telefono_secundario }
      : {}),
    ...(input.notas !== undefined ? { notas: input.notas } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.nivel !== undefined ? { nivel: input.nivel } : {}),
  };
  return repo.create(tenantId, base);
}
