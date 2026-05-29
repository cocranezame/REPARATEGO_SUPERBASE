import type { Categoria } from "../entities/categoria.js";

export type CreateCategoriaData = {
  nombre: string;
  descripcion?: string;
  categoria_padre_id?: string;
  orden: number;
};

export type UpdateCategoriaData = {
  nombre?: string;
  descripcion?: string | null;
  categoria_padre_id?: string | null;
  orden?: number;
  activo?: boolean;
};

export type ListCategoriasParams = {
  search?: string;
  activo?: boolean;
  padre_id?: string;
  incluir_hijos?: boolean;
  page: number;
  pageSize: number;
};

export type ListCategoriasResult = {
  items: Categoria[];
  total: number;
};

export interface ICategoriaRepository {
  findById(tenantId: string, id: string): Promise<Categoria | null>;
  list(tenantId: string, params: ListCategoriasParams): Promise<ListCategoriasResult>;
  create(tenantId: string, data: CreateCategoriaData): Promise<Categoria>;
  update(tenantId: string, id: string, data: UpdateCategoriaData): Promise<Categoria | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
