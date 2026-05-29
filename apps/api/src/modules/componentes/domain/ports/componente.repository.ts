import type { Componente } from "../entities/componente.js";

export type CreateComponenteData = {
  categoria_id: string;
  nombre: string;
  descripcion?: string;
};

export type UpdateComponenteData = {
  categoria_id?: string;
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
};

export type ListComponentesParams = {
  categoria_id?: string;
  search?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListComponentesResult = {
  items: Componente[];
  total: number;
};

export interface IComponenteRepository {
  findById(tenantId: string, id: string): Promise<Componente | null>;
  list(tenantId: string, params: ListComponentesParams): Promise<ListComponentesResult>;
  create(tenantId: string, data: CreateComponenteData): Promise<Componente>;
  update(tenantId: string, id: string, data: UpdateComponenteData): Promise<Componente | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
