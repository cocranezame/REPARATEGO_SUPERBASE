export interface UserForAuth {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  nombres: string;
  apellidos: string;
  rol: string;
  password_hash: string;
  activo: boolean;
}

export interface UserForRefresh {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  rol: string;
  activo: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
