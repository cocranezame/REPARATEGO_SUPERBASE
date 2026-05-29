import type { TipoDocumento } from "@kallpasoft/shared";
import type { Cliente } from "../entities/cliente.js";

export type CreateClienteData = {
  tipo_documento: TipoDocumento;
  numero_documento: string;
  tipo_persona: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  email?: string;
  telefono?: string;
  telefono_secundario?: string;
  notas?: string;
};

export type UpdateClienteData = {
  tipo_documento?: TipoDocumento;
  numero_documento?: string;
  tipo_persona?: string;
  nombres?: string | null;
  apellidos?: string | null;
  razon_social?: string | null;
  email?: string | null;
  telefono?: string | null;
  telefono_secundario?: string | null;
  notas?: string | null;
  activo?: boolean;
};

export type ListClientesParams = {
  search?: string;
  tipo_documento?: TipoDocumento;
  tipo_persona?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListClientesResult = {
  items: Cliente[];
  total: number;
};

export interface IClienteRepository {
  findById(tenantId: string, id: string): Promise<Cliente | null>;
  findByDocumento(tenantId: string, tipo: TipoDocumento, numero: string): Promise<Cliente | null>;
  list(tenantId: string, params: ListClientesParams): Promise<ListClientesResult>;
  create(tenantId: string, data: CreateClienteData): Promise<Cliente>;
  update(tenantId: string, id: string, data: UpdateClienteData): Promise<Cliente | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
