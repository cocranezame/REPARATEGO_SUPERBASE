import type {
  Proveedor,
  ProveedorContacto,
  ProveedorLinea,
  ProveedorMetodoPago,
} from "../entities/proveedor.js";

export type CreateProveedorData = {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  distrito?: string;
  email?: string;
  telefono?: string;
  web?: string;
  notas?: string;
  calificacion?: number;
};

export type UpdateProveedorData = {
  ruc?: string;
  razon_social?: string;
  nombre_comercial?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  email?: string | null;
  telefono?: string | null;
  web?: string | null;
  notas?: string | null;
  calificacion?: number | null;
  activo?: boolean;
};

export type ListProveedoresParams = {
  search?: string;
  activo?: boolean;
  page: number;
  pageSize: number;
};

export type ListProveedoresResult = {
  items: Proveedor[];
  total: number;
};

export type CreateProveedorContactoData = {
  nombre: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  es_principal: boolean;
};

export type UpdateProveedorContactoData = {
  nombre?: string;
  cargo?: string | null;
  telefono?: string | null;
  email?: string | null;
  es_principal?: boolean;
  activo?: boolean;
};

export type CreateProveedorMetodoPagoData = {
  tipo: string;
  banco?: string;
  numero_cuenta?: string;
  cci?: string;
  titular?: string;
};

export type UpdateProveedorMetodoPagoData = {
  tipo?: string;
  banco?: string | null;
  numero_cuenta?: string | null;
  cci?: string | null;
  titular?: string | null;
  activo?: boolean;
};

export type CreateProveedorLineaData = {
  categoria_id?: string;
  componente_id?: string;
  descripcion?: string;
};

export interface IProveedorRepository {
  findById(tenantId: string, id: string): Promise<Proveedor | null>;
  list(tenantId: string, params: ListProveedoresParams): Promise<ListProveedoresResult>;
  create(tenantId: string, data: CreateProveedorData): Promise<Proveedor>;
  update(tenantId: string, id: string, data: UpdateProveedorData): Promise<Proveedor | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;

  listContactos(tenantId: string, proveedorId: string): Promise<ProveedorContacto[]>;
  createContacto(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorContactoData
  ): Promise<ProveedorContacto>;
  updateContacto(
    tenantId: string,
    id: string,
    proveedorId: string,
    data: UpdateProveedorContactoData
  ): Promise<ProveedorContacto | null>;
  deleteContacto(tenantId: string, id: string, proveedorId: string): Promise<boolean>;

  listMetodosPago(tenantId: string, proveedorId: string): Promise<ProveedorMetodoPago[]>;
  createMetodoPago(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorMetodoPagoData
  ): Promise<ProveedorMetodoPago>;
  updateMetodoPago(
    tenantId: string,
    id: string,
    proveedorId: string,
    data: UpdateProveedorMetodoPagoData
  ): Promise<ProveedorMetodoPago | null>;
  deleteMetodoPago(tenantId: string, id: string, proveedorId: string): Promise<boolean>;

  listLineas(tenantId: string, proveedorId: string): Promise<ProveedorLinea[]>;
  createLinea(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorLineaData
  ): Promise<ProveedorLinea>;
  deleteLinea(tenantId: string, id: string, proveedorId: string): Promise<boolean>;
}
