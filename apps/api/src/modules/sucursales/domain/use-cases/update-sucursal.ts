import type { Sucursal } from "../entities/sucursal.js";
import type { ISucursalRepository, UpdateSucursalData } from "../ports/sucursal.repository.js";

export interface UpdateSucursalInput {
  nombre?: string;
  direccion?: string;
  distrito?: string;
  telefono?: string;
  es_principal?: boolean;
}

export async function updateSucursal(
  repo: ISucursalRepository,
  tenantId: string,
  id: string,
  input: UpdateSucursalInput
): Promise<Sucursal | null> {
  const data: UpdateSucursalData = {
    ...(input.nombre !== undefined ? { nombre: input.nombre } : {}),
    ...(input.direccion !== undefined ? { direccion: input.direccion } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.es_principal !== undefined ? { es_principal: input.es_principal } : {}),
  };
  return repo.update(tenantId, id, data);
}
