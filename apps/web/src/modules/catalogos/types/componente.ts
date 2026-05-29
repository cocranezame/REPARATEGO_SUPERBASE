export type ComponenteDto = {
  id: string;
  tenant_id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ComponentesListResponse = {
  success: true;
  data: ComponenteDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ComponenteResponse = {
  success: true;
  data: ComponenteDto;
};

export type ComponentesParams = {
  search?: string;
  activo?: boolean;
  categoria_id?: string;
  page?: number;
  pageSize?: number;
};
