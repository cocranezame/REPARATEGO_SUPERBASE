export type EstadoVisita =
  | "POR_VALIDAR"
  | "VALIDADA"
  | "ASIGNADA"
  | "EN_CAMINO"
  | "EN_SITIO"
  | "TERMINADA"
  | "CANCELADA";

export type TarifaDistritoDto = {
  id: string;
  tenant_id: string;
  distrito: string;
  provincia: string;
  tarifa: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type VisitaDomicilioDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  cliente_id: string;
  cliente_nombre?: string;
  direccion_id?: string;
  direccion_texto: string;
  distrito: string;
  tecnico_id?: string;
  tecnico_nombre?: string;
  fecha_programada: string;
  hora_inicio?: string;
  hora_fin?: string;
  estado: EstadoVisita;
  tarifa: string;
  motivo_visita?: string;
  diagnostico_campo?: string;
  orden_servicio_id?: string;
  venta_id?: string;
  motivo_cancelacion?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type TecnicoDisponibilidadDto = {
  tecnico_id: string;
  tecnico_nombre: string;
  visitas: {
    id: string;
    codigo: string;
    cliente_nombre?: string;
    hora_inicio?: string;
    hora_fin?: string;
    estado: string;
  }[];
};

export type VisitasDomicilioParams = {
  estado?: EstadoVisita;
  tecnico_id?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
};

export type TarifasDistritoParams = {
  search?: string;
  activo?: boolean;
};

export type VisitasDomicilioListResponse = {
  success: boolean;
  data: VisitaDomicilioDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type VisitaDomicilioResponse = {
  success: boolean;
  data: VisitaDomicilioDto;
};

export type TarifasDistritoListResponse = {
  success: boolean;
  data: TarifaDistritoDto[];
};

export type TarifaDistritoResponse = {
  success: boolean;
  data: TarifaDistritoDto;
};

export type DisponibilidadResponse = {
  success: boolean;
  data: TecnicoDisponibilidadDto[];
};
