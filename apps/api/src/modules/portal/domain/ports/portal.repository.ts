import type { PortalCliente, PortalInstancia, PortalServicio } from "../entities/portal.js";

export type PortalAceptarValidacionData = {
  ip_address?: string | undefined;
  documento_version: string;
  texto_mostrado: string;
};

export type PortalAceptarPresupuestoData = {
  preventivo_accepted: boolean;
  ip_address?: string | undefined;
  documento_version: string;
  texto_mostrado: string;
};

export interface IPortalRepository {
  loginByDocCelular(
    tenantId: string,
    numerDoc: string,
    celular: string
  ): Promise<PortalCliente | null>;

  listInstancias(tenantId: string, clienteId: string): Promise<PortalInstancia[]>;

  getServicio(tenantId: string, ordenId: string, clienteId: string): Promise<PortalServicio | null>;

  aceptarValidacion(
    tenantId: string,
    ordenId: string,
    clienteId: string,
    data: PortalAceptarValidacionData
  ): Promise<{ estado_nuevo: string }>;

  aceptarPresupuesto(
    tenantId: string,
    ordenId: string,
    clienteId: string,
    data: PortalAceptarPresupuestoData
  ): Promise<{ estado_nuevo: string }>;
}
