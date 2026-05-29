import type { Marca } from "../entities/marca.js";

export type CreateMarcaData = {
  nombre: string;
  logo_url?: string;
};

export type UpdateMarcaData = {
  nombre?: string;
  logo_url?: string | null;
  activo?: boolean;
};

export type ListMarcasParams = {
  search?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListMarcasResult = {
  items: Marca[];
  total: number;
};

export interface IMarcaRepository {
  findById(tenantId: string, id: string): Promise<Marca | null>;
  list(tenantId: string, params: ListMarcasParams): Promise<ListMarcasResult>;
  create(tenantId: string, data: CreateMarcaData): Promise<Marca>;
  update(tenantId: string, id: string, data: UpdateMarcaData): Promise<Marca | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
