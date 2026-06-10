export type TipoRepuestoDto = {
  id: string;
  tenant_id: string;
  componente_id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type TiposRepuestoListResponse = {
  success: true;
  data: TipoRepuestoDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type TipoRepuestoResponse = {
  success: true;
  data: TipoRepuestoDto;
};

export type TiposRepuestoParams = {
  componente_id?: string;
  search?: string;
  activo?: boolean;
  page?: number;
  pageSize?: number;
};
