export type CategoriaDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  descripcion: string | null;
  categoria_padre_id: string | null;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  hijos?: CategoriaDto[];
};

export type CategoriasListResponse = {
  success: true;
  data: CategoriaDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type CategoriaResponse = {
  success: true;
  data: CategoriaDto;
};

export type CategoriasParams = {
  search?: string;
  activo?: boolean;
  padre_id?: string;
  incluir_hijos?: boolean;
  page?: number;
  pageSize?: number;
};
