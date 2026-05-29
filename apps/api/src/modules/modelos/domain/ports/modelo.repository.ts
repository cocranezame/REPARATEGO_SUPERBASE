import type { Modelo } from "../entities/modelo.js";

export type CreateModeloData = {
  marca_id: string;
  categoria_id: string;
  nombre: string;
};

export type UpdateModeloData = {
  marca_id?: string;
  categoria_id?: string;
  nombre?: string;
  activo?: boolean;
};

export type ListModelosParams = {
  marca_id?: string;
  categoria_id?: string;
  search?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListModelosResult = {
  items: Modelo[];
  total: number;
};

export interface IModeloRepository {
  findById(tenantId: string, id: string): Promise<Modelo | null>;
  list(tenantId: string, params: ListModelosParams): Promise<ListModelosResult>;
  create(tenantId: string, data: CreateModeloData): Promise<Modelo>;
  update(tenantId: string, id: string, data: UpdateModeloData): Promise<Modelo | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
