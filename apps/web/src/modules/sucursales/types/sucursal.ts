export type SucursalDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  direccion: string | null;
  distrito: string | null;
  telefono: string | null;
  es_principal: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type SucursalesListResponse = {
  success: true;
  data: SucursalDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type SucursalResponse = {
  success: true;
  data: SucursalDto;
};

export type SucursalesParams = {
  search?: string;
  activo?: boolean;
  page?: number;
  pageSize?: number;
};
