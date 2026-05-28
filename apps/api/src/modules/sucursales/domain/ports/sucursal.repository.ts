import type { Sucursal } from "../entities/sucursal.js";

export interface CreateSucursalData {
  nombre: string;
  direccion?: string;
  distrito?: string;
  telefono?: string;
  es_principal: boolean;
}

export interface UpdateSucursalData {
  nombre?: string;
  direccion?: string;
  distrito?: string;
  telefono?: string;
  es_principal?: boolean;
}

export interface ListSucursalesParams {
  page: number;
  pageSize: number;
  search?: string;
  activo?: boolean;
}

export interface ListSucursalesResult {
  items: Sucursal[];
  total: number;
}

export interface ISucursalRepository {
  findById(tenantId: string, id: string): Promise<Sucursal | null>;
  list(tenantId: string, params: ListSucursalesParams): Promise<ListSucursalesResult>;
  create(tenantId: string, data: CreateSucursalData): Promise<Sucursal>;
  update(tenantId: string, id: string, data: UpdateSucursalData): Promise<Sucursal | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
