import type {
  CondicionPago,
  Proveedor,
  ProveedorContacto,
  ProveedorLinea,
  ProveedorMetodoPago,
} from "../entities/proveedor.js";

// ─── Condición de pago ────────────────────────────────────────────────────────

export type CreateCondicionPagoData = {
  nombre: string;
  dias_credito?: number | undefined;
  es_default?: boolean | undefined;
};

export type UpdateCondicionPagoData = {
  nombre?: string | undefined;
  dias_credito?: number | undefined;
  es_default?: boolean | undefined;
  activo?: boolean | undefined;
};

// ─── Proveedor ────────────────────────────────────────────────────────────────

export type CreateProveedorData = {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string | undefined;
  contacto_nombre?: string | undefined;
  telefono?: string | undefined;
  telefono2?: string | undefined;
  telefono3?: string | undefined;
  email?: string | undefined;
  direccion?: string | undefined;
  departamento?: string | undefined;
  distrito?: string | undefined;
  condicion_pago_id?: string | undefined;
  web?: string | undefined;
  notas?: string | undefined;
  observaciones?: string | undefined;
  calificacion?: number | undefined;
};

export type UpdateProveedorData = {
  ruc?: string | undefined;
  razon_social?: string | undefined;
  nombre_comercial?: string | null | undefined;
  contacto_nombre?: string | null | undefined;
  telefono?: string | null | undefined;
  telefono2?: string | null | undefined;
  telefono3?: string | null | undefined;
  email?: string | null | undefined;
  direccion?: string | null | undefined;
  departamento?: string | null | undefined;
  distrito?: string | null | undefined;
  condicion_pago_id?: string | null | undefined;
  web?: string | null | undefined;
  notas?: string | null | undefined;
  observaciones?: string | null | undefined;
  calificacion?: number | null | undefined;
  activo?: boolean | undefined;
};

export type ListProveedoresParams = {
  search?: string | undefined;
  activo?: boolean | undefined;
  page: number;
  pageSize: number;
};

export type ListProveedoresResult = {
  items: Proveedor[];
  total: number;
};

// ─── Sub-recursos ─────────────────────────────────────────────────────────────

export type CreateProveedorContactoData = {
  nombre: string;
  cargo?: string | undefined;
  telefono?: string | undefined;
  email?: string | undefined;
  es_principal: boolean;
};

export type UpdateProveedorContactoData = {
  nombre?: string | undefined;
  cargo?: string | null | undefined;
  telefono?: string | null | undefined;
  email?: string | null | undefined;
  es_principal?: boolean | undefined;
  activo?: boolean | undefined;
};

export type CreateProveedorMetodoPagoData = {
  tipo_cuenta?: string | undefined;
  tipo: string;
  banco?: string | undefined;
  numero_cuenta?: string | undefined;
  cci?: string | undefined;
  titular?: string | undefined;
};

export type UpdateProveedorMetodoPagoData = {
  tipo_cuenta?: string | null | undefined;
  tipo?: string | undefined;
  banco?: string | null | undefined;
  numero_cuenta?: string | null | undefined;
  cci?: string | null | undefined;
  titular?: string | null | undefined;
  activo?: boolean | undefined;
};

export type CreateProveedorLineaData = {
  categoria_id?: string | undefined;
  componente_id?: string | undefined;
  descripcion?: string | undefined;
};

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IProveedorRepository {
  // condicion_pago
  listCondicionesPago(tenantId: string): Promise<CondicionPago[]>;
  createCondicionPago(tenantId: string, data: CreateCondicionPagoData): Promise<CondicionPago>;
  updateCondicionPago(
    tenantId: string,
    id: string,
    data: UpdateCondicionPagoData
  ): Promise<CondicionPago | null>;
  deleteCondicionPago(tenantId: string, id: string): Promise<boolean>;

  // proveedor
  findById(tenantId: string, id: string): Promise<Proveedor | null>;
  list(tenantId: string, params: ListProveedoresParams): Promise<ListProveedoresResult>;
  create(tenantId: string, data: CreateProveedorData): Promise<Proveedor>;
  update(tenantId: string, id: string, data: UpdateProveedorData): Promise<Proveedor | null>;
  softDelete(tenantId: string, id: string): Promise<boolean>;

  // contactos
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

  // métodos de pago
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

  // líneas
  listLineas(tenantId: string, proveedorId: string): Promise<ProveedorLinea[]>;
  createLinea(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorLineaData
  ): Promise<ProveedorLinea>;
  deleteLinea(tenantId: string, id: string, proveedorId: string): Promise<boolean>;
}
