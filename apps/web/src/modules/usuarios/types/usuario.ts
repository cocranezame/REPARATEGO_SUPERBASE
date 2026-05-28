import type { RolUsuario, TipoDocumento } from "@kallpasoft/shared";

export type UsuarioDto = {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  telefono: string | null;
  rol: RolUsuario;
  ultimo_login: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type UsuariosListResponse = {
  success: true;
  data: UsuarioDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type UsuarioResponse = {
  success: true;
  data: UsuarioDto;
};

export type UsuariosParams = {
  search?: string;
  rol?: RolUsuario;
  activo?: boolean;
  page?: number;
  pageSize?: number;
};
