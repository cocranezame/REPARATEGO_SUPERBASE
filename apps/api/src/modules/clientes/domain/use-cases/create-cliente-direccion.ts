import type { CreateClienteDireccionInput } from "@kallpasoft/validators";
import type { ClienteDireccion } from "../entities/cliente-direccion.js";
import type {
  CreateClienteDireccionData,
  IClienteDireccionRepository,
} from "../ports/cliente-direccion.repository.js";

export async function createClienteDireccion(
  repo: IClienteDireccionRepository,
  tenantId: string,
  clienteId: string,
  input: Omit<CreateClienteDireccionInput, "cliente_id">
): Promise<ClienteDireccion> {
  const data: CreateClienteDireccionData = {
    cliente_id: clienteId,
    etiqueta: input.etiqueta,
    direccion: input.direccion,
    es_principal: input.es_principal,
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.provincia !== undefined ? { provincia: input.provincia } : {}),
    ...(input.departamento !== undefined ? { departamento: input.departamento } : {}),
    ...(input.referencia !== undefined ? { referencia: input.referencia } : {}),
    ...(input.latitud !== undefined ? { latitud: input.latitud } : {}),
    ...(input.longitud !== undefined ? { longitud: input.longitud } : {}),
  };
  return repo.create(tenantId, data);
}
