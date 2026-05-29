import type { ClienteDireccion } from "../entities/cliente-direccion.js";

export type CreateClienteDireccionData = {
  cliente_id: string;
  etiqueta: string;
  direccion: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  es_principal: boolean;
};

export type UpdateClienteDireccionData = {
  etiqueta?: string;
  direccion?: string;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  referencia?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  es_principal?: boolean;
  activo?: boolean;
};

export interface IClienteDireccionRepository {
  findById(tenantId: string, id: string, clienteId: string): Promise<ClienteDireccion | null>;
  listByCliente(tenantId: string, clienteId: string): Promise<ClienteDireccion[]>;
  create(tenantId: string, data: CreateClienteDireccionData): Promise<ClienteDireccion>;
  update(
    tenantId: string,
    id: string,
    clienteId: string,
    data: UpdateClienteDireccionData
  ): Promise<ClienteDireccion | null>;
  softDelete(tenantId: string, id: string, clienteId: string): Promise<boolean>;
}
