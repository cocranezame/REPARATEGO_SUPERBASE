export type ModeloDto = {
  id: string;
  tenant_id: string;
  marca_id: string;
  categoria_id: string;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ModelosListResponse = {
  success: true;
  data: ModeloDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ModeloResponse = {
  success: true;
  data: ModeloDto;
};

export type ModelosParams = {
  search?: string;
  activo?: boolean;
  marca_id?: string;
  categoria_id?: string;
  page?: number;
  pageSize?: number;
};
