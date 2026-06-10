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
    ...(input.contacto_nombre !== undefined ? { contacto_nombre: input.contacto_nombre } : {}),
    ...(input.telefono !== undefined ? { telefono: input.telefono } : {}),
    ...(input.telefono2 !== undefined ? { telefono2: input.telefono2 } : {}),
    ...(input.telefono3 !== undefined ? { telefono3: input.telefono3 } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.direccion !== undefined ? { direccion: input.direccion } : {}),
    ...(input.departamento !== undefined ? { departamento: input.departamento } : {}),
    ...(input.distrito !== undefined ? { distrito: input.distrito } : {}),
    ...(input.condicion_pago_id !== undefined
      ? { condicion_pago_id: input.condicion_pago_id }
      : {}),
    ...(input.web !== undefined ? { web: input.web } : {}),
    ...(input.notas !== undefined ? { notas: input.notas } : {}),
    ...(input.observaciones !== undefined ? { observaciones: input.observaciones } : {}),
    ...(input.calificacion !== undefined ? { calificacion: input.calificacion } : {}),
  };
  return repo.create(tenantId, data);
}
