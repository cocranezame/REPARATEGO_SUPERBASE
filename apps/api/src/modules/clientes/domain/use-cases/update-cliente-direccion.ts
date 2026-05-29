import type { UpdateClienteDireccionInput } from "@kallpasoft/validators";
import type { ClienteDireccion } from "../entities/cliente-direccion.js";
import type {
  IClienteDireccionRepository,
  UpdateClienteDireccionData,
} from "../ports/cliente-direccion.repository.js";

export async function updateClienteDireccion(
  repo: IClienteDireccionRepository,
  tenantId: string,
  id: string,
  clienteId: string,
  input: UpdateClienteDireccionInput
): Promise<ClienteDireccion | null> {
  const data: UpdateClienteDireccionData = {
    ...(input.etiqueta !== undefined ? { etiqueta: input.etiqueta } : {}),
    ...(input.direccion !== undefined ? { direccion: input.direccion } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.provincia !== undefined ? { provincia: input.provincia } : {}),
    ...(input.departamento !== undefined ? { departamento: input.departamento } : {}),
    ...(input.referencia !== undefined ? { referencia: input.referencia } : {}),
    ...(input.latitud !== undefined ? { latitud: input.latitud } : {}),
    ...(input.longitud !== undefined ? { longitud: input.longitud } : {}),
    ...(input.es_principal !== undefined ? { es_principal: input.es_principal } : {}),
  };
  return repo.update(tenantId, id, clienteId, data);
}
