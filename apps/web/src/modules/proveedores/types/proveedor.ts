export type CondicionPagoDto = {
  id: string;
  tenant_id: string;
  nombre: string;
  dias_credito: number;
  es_default: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProveedorDto = {
  id: string;
  tenant_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  contacto_nombre: string | null;
  telefono: string | null;
  telefono2: string | null;
  telefono3: string | null;
  email: string | null;
  direccion: string | null;
  departamento: string | null;
  distrito: string | null;
  condicion_pago_id: string | null;
  web: string | null;
  notas: string | null;
  observaciones: string | null;
  calificacion: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  contactos?: ProveedorContactoDto[];
  metodos_pago?: ProveedorMetodoPagoDto[];
  lineas?: ProveedorLineaDto[];
};

export type ProveedorContactoDto = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  es_principal: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProveedorMetodoPagoDto = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  tipo_cuenta: string | null;
  tipo: string;
  banco: string | null;
  numero_cuenta: string | null;
  cci: string | null;
  titular: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type ProveedorLineaDto = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  categoria_id: string | null;
  componente_id: string | null;
  descripcion: string | null;
  created_at: string;
};

export type CondicionPagoListResponse = {
  success: true;
  data: CondicionPagoDto[];
};

export type CondicionPagoResponse = {
  success: true;
  data: CondicionPagoDto;
};

export type ProveedoresListResponse = {
  success: true;
  data: ProveedorDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type ProveedorResponse = {
  success: true;
  data: ProveedorDto;
};

export type ProveedorContactosListResponse = {
  success: true;
  data: ProveedorContactoDto[];
};

export type ProveedorContactoResponse = {
  success: true;
  data: ProveedorContactoDto;
};

export type ProveedorMetodosPagoListResponse = {
  success: true;
  data: ProveedorMetodoPagoDto[];
};

export type ProveedorMetodoPagoResponse = {
  success: true;
  data: ProveedorMetodoPagoDto;
};

export type ProveedorLineasListResponse = {
  success: true;
  data: ProveedorLineaDto[];
};

export type ProveedorLineaResponse = {
  success: true;
  data: ProveedorLineaDto;
};

export type ProveedoresParams = {
  search?: string;
  activo?: boolean;
  page?: number;
  pageSize?: number;
};
