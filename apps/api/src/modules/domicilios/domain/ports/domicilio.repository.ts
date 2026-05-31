import type { TarifaDistrito, VisitaDomicilio } from "../entities/domicilio.js";

export type CreateTarifaData = {
  distrito: string;
  provincia?: string | undefined;
  tarifa: number;
};

export type UpdateTarifaData = {
  distrito?: string | undefined;
  provincia?: string | undefined;
  tarifa?: number | undefined;
  activo?: boolean | undefined;
};

export type ListTarifasParams = {
  search?: string | undefined;
  activo?: boolean | undefined;
};

export type CreateVisitaData = {
  cliente_id: string;
  direccion_id?: string | undefined;
  direccion_texto: string;
  distrito: string;
  tecnico_id?: string | undefined;
  fecha_programada: string;
  hora_inicio?: string | undefined;
  hora_fin?: string | undefined;
  motivo_visita?: string | undefined;
  notas?: string | undefined;
};

export type UpdateEstadoData = {
  estado: string;
  diagnostico_campo?: string | undefined;
  motivo_cancelacion?: string | undefined;
  tecnico_id?: string | undefined;
  cobrar?: boolean | undefined;
  caja_id?: string | undefined;
  sucursal_id?: string | undefined;
  userId: string;
};

export type GenerarOsData = {
  instancia_id: string;
  sucursal_id: string;
  falla_ingreso: string;
  tipo_servicio?: string | undefined;
  userId: string;
};

export type ListVisitasParams = {
  estado?: string | undefined;
  tecnico_id?: string | undefined;
  desde?: string | undefined;
  hasta?: string | undefined;
  page: number;
  pageSize: number;
};

export type ListVisitasResult = {
  items: VisitaDomicilio[];
  total: number;
};

export type TecnicoDisponibilidad = {
  tecnico_id: string;
  tecnico_nombre: string;
  visitas: {
    id: string;
    codigo: string;
    cliente_nombre?: string | undefined;
    hora_inicio?: string | undefined;
    hora_fin?: string | undefined;
    estado: string;
  }[];
};

export interface IDomicilioRepository {
  listTarifas(tenantId: string, params: ListTarifasParams): Promise<TarifaDistrito[]>;
  createTarifa(tenantId: string, data: CreateTarifaData): Promise<TarifaDistrito>;
  updateTarifa(
    tenantId: string,
    id: string,
    data: UpdateTarifaData
  ): Promise<TarifaDistrito | null>;
  deleteTarifa(tenantId: string, id: string): Promise<boolean>;

  listVisitas(tenantId: string, params: ListVisitasParams): Promise<ListVisitasResult>;
  findVisitaById(tenantId: string, id: string): Promise<VisitaDomicilio | null>;
  createVisita(tenantId: string, data: CreateVisitaData): Promise<VisitaDomicilio>;
  updateEstado(
    tenantId: string,
    id: string,
    data: UpdateEstadoData
  ): Promise<VisitaDomicilio | null>;
  generarOrdenServicio(
    tenantId: string,
    visitaId: string,
    data: GenerarOsData
  ): Promise<VisitaDomicilio | null>;

  getDisponibilidad(
    tenantId: string,
    fecha: string,
    tecnicoId?: string
  ): Promise<TecnicoDisponibilidad[]>;
}
