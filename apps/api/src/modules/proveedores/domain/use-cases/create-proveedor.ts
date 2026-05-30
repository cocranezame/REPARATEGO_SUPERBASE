import type { CreateProveedorInput } from "@kallpasoft/validators";
import type { Proveedor } from "../entities/proveedor.js";
import type { CreateProveedorData, IProveedorRepository } from "../ports/proveedor.repository.js";

export async function createProveedor(
  repo: IProveedorRepository,
  tenantId: string,
  input: CreateProveedorInput
): Promise<Proveedor> {
  const data: CreateProveedorData = {
    ruc: input.ruc,
    razon_social: input.razon_social,
    ...(input.nombre_comercial !== undefined ? { nombre_comercial: input.nombre_comercial } : {}),
    ...(input.direccion !== undefined ? { direccion: input.direccion } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.web !== undefined ? { web: input.web } : {}),
    ...(input.notas !== undefined ? { notas: input.notas } : {}),
    ...(input.calificacion !== undefined ? { calificacion: input.calificacion } : {}),
  };
  return repo.create(tenantId, data);
}
