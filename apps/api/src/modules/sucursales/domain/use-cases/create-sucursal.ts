import type { CreateSucursalInput } from "@kallpasoft/validators";
import type { Sucursal } from "../entities/sucursal.js";
import type { CreateSucursalData, ISucursalRepository } from "../ports/sucursal.repository.js";

export async function createSucursal(
  repo: ISucursalRepository,
  tenantId: string,
  input: CreateSucursalInput
): Promise<Sucursal> {
  const data: CreateSucursalData = {
    nombre: input.nombre,
    ...(input.direccion !== undefined ? { direccion: input.direccion } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    es_principal: input.es_principal,
  };
  return repo.create(tenantId, data);
}
