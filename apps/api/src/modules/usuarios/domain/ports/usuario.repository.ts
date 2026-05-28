import type { RolUsuario, TipoDocumento } from "@kallpasoft/shared";
import type { Usuario } from "../entities/usuario.js";

export type CreateUsuarioData = {
  sucursal_id?: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  password_hash: string;
  rol: RolUsuario;
};

export type UpdateUsuarioData = {
  sucursal_id?: string | null;
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  nombres?: string;
  apellidos?: string;
  email?: string | null;
  telefono?: string | null;
  password_hash?: string;
  rol?: RolUsuario;
};

export type ListUsuariosParams = {
  search?: string;
  rol?: RolUsuario;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListUsuariosResult = {
  items: Usuario[];
  total: number;
};

export interface IUsuarioRepository {
  findById(tenantId: string, id: string): Promise<Usuario | null>;
  list(tenantId: string, params: ListUsuariosParams): Promise<ListUsuariosResult>;
  create(tenantId: string, data: CreateUsuarioData): Promise<Usuario>;
  update(tenantId: string, id: string, data: UpdateUsuarioData): Promise<Usuario | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
