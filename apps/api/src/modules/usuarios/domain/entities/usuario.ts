import type { RolUsuario, TipoDocumento } from "@kallpasoft/shared";

export type Usuario = {
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
  ultimo_login: Date | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
