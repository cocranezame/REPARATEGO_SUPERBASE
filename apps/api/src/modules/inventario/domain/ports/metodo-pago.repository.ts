import type { MetodoPagoCatalogo } from "../entities/metodo-pago-catalogo.js";

export type CreateMetodoPagoData = {
  nombre: string;
};

export type UpdateMetodoPagoData = {
  nombre?: string;
  activo?: boolean;
};

export interface IMetodoPagoRepository {
  list(tenantId: string, activo?: boolean): Promise<MetodoPagoCatalogo[]>;
  create(tenantId: string, data: CreateMetodoPagoData): Promise<MetodoPagoCatalogo>;
  update(
    tenantId: string,
    id: string,
    data: UpdateMetodoPagoData
  ): Promise<MetodoPagoCatalogo | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;
}
