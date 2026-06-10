import type { TipoRepuesto } from "../entities/tipo-repuesto.js";

export type CreateTipoRepuestoData = {
  componente_id: string;
  nombre: string;
};

export type UpdateTipoRepuestoData = {
  componente_id?: string;
  nombre?: string;
  activo?: boolean;
};

export type ListTiposRepuestoParams = {
  componente_id?: string;
  search?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListTiposRepuestoResult = {
  items: TipoRepuesto[];
  total: number;
};

export interface ITipoRepuestoRepository {
  findById(tenantId: string, id: string): Promise<TipoRepuesto | null>;
  list(tenantId: string, params: ListTiposRepuestoParams): Promise<ListTiposRepuestoResult>;
  create(tenantId: string, data: CreateTipoRepuestoData): Promise<TipoRepuesto>;
  update(tenantId: string, id: string, data: UpdateTipoRepuestoData): Promise<TipoRepuesto | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
