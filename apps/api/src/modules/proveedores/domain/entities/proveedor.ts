export type CondicionPago = {
  id: string;
  tenant_id: string;
  nombre: string;
  dias_credito: number;
  es_default: boolean;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Proveedor = {
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
  created_at: Date;
  updated_at: Date;
  contactos?: ProveedorContacto[];
  metodos_pago?: ProveedorMetodoPago[];
  lineas?: ProveedorLinea[];
};

export type ProveedorContacto = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  nombre: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  es_principal: boolean;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type ProveedorMetodoPago = {
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
  created_at: Date;
  updated_at: Date;
};

export type ProveedorLinea = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  categoria_id: string | null;
  componente_id: string | null;
  descripcion: string | null;
  created_at: Date;
};
