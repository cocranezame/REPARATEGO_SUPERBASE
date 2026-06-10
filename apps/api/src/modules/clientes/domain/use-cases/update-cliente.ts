import type { TipoDocumento } from "@kallpasoft/shared";
import type { Cliente } from "../entities/cliente.js";
import type { IClienteRepository, UpdateClienteData } from "../ports/cliente.repository.js";

export interface UpdateClienteInput {
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  tipo_persona?: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  telefono_secundario?: string;
  notas?: string;
  distrito?: string | null;
  nivel?: string;
  activo?: boolean;
}

export async function updateCliente(
  repo: IClienteRepository,
  tenantId: string,
  id: string,
  input: UpdateClienteInput
): Promise<Cliente | null> {
  const data: UpdateClienteData = {
    ...(input.tipo_documento !== undefined ? { tipo_documento: input.tipo_documento } : {}),
    ...(input.numero_documento !== undefined ? { numero_documento: input.numero_documento } : {}),
    ...(input.tipo_persona !== undefined ? { tipo_persona: input.tipo_persona } : {}),
    ...(input.nombres !== undefined ? { nombres: input.nombres } : {}),
    ...(input.apellidos !== undefined ? { apellidos: input.apellidos } : {}),
    ...(input.razon_social !== undefined ? { razon_social: input.razon_social } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.telefono_secundario !== undefined
      ? { telefono_secundario: input.telefono_secundario }
      : {}),
    ...(input.notas !== undefined ? { notas: input.notas } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.nivel !== undefined ? { nivel: input.nivel } : {}),
    ...(input.activo !== undefined ? { activo: input.activo } : {}),
  };
  return repo.update(tenantId, id, data);
}
