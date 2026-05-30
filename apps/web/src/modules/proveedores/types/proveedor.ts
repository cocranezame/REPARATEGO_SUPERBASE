export type ProveedorDto = {
  id: string;
  tenant_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion: string | null;
  distrito: string | null;
  email: string | null;
  telefono: string | null;
  web: string | null;
  notas: string | null;
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
