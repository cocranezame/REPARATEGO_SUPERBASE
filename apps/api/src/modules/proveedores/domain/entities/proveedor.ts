export type Proveedor = {
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
