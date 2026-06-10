export type ClienteDto = {
  id: string;
  tenant_id: string;
  tipo_documento: string;
  numero_documento: string;
  tipo_persona: "NATURAL" | "JURIDICA";
  nombres: string | null;
  apellidos: string | null;
  razon_social: string | null;
  email: string | null;
  telefono: string | null;
  telefono_secundario: string | null;
  notas: string | null;
  distrito: string | null;
  nivel: "ALTO" | "NORMAL" | "BAJO";
  activo: boolean;
  created_at: string;
  updated_at: string;
  direcciones?: ClienteDireccionDto[];
};

export type ClienteDireccionDto = {
  id: string;
  tenant_id: string;
  cliente_id: string;
  etiqueta: string;
  direccion: string;
  distrito: string | null;
  provincia: string | null;
  departamento: string | null;
  referencia: string | null;
  latitud: string | null;
  longitud: string | null;
  es_principal: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientesListResponse = {
  success: true;
  data: ClienteDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ClienteResponse = {
  success: true;
  data: ClienteDto;
};

export type DireccionesListResponse = {
  success: true;
  data: ClienteDireccionDto[];
};

export type DireccionResponse = {
  success: true;
  data: ClienteDireccionDto;
};

export type ClientesParams = {
  search?: string;
  tipo_documento?: string;
  tipo_persona?: "NATURAL" | "JURIDICA";
  activo?: boolean;
  page?: number;
  pageSize?: number;
};
