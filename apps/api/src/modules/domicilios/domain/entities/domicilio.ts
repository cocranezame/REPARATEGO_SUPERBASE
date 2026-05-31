export type TarifaDistrito = {
  id: string;
  tenant_id: string;
  distrito: string;
  provincia: string;
  tarifa: string;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type VisitaDomicilio = {
  id: string;
  tenant_id: string;
  codigo: string;
  cliente_id: string;
  cliente_nombre?: string | undefined;
  direccion_id?: string | undefined;
  direccion_texto: string;
  distrito: string;
  tecnico_id?: string | undefined;
  tecnico_nombre?: string | undefined;
  fecha_programada: string;
  hora_inicio?: string | undefined;
  hora_fin?: string | undefined;
  estado: string;
  tarifa: string;
  motivo_visita?: string | undefined;
  diagnostico_campo?: string | undefined;
  orden_servicio_id?: string | undefined;
  venta_id?: string | undefined;
  motivo_cancelacion?: string | undefined;
  notas?: string | undefined;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};
