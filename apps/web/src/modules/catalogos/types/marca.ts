export type MarcaDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  logo_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type MarcasListResponse = {
  success: true;
  data: MarcaDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type MarcaResponse = {
  success: true;
  data: MarcaDto;
};

export type MarcasParams = {
  search?: string;
  activo?: boolean;
  page?: number;
  pageSize?: number;
};
