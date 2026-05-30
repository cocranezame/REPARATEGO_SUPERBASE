export type EstadoOrdenCompra =
  | "GENERADA"
  | "ENVIADA"
  | "TERMINADA"
  | "INGRESADA"
  | "PENDIENTE_PAGO";

export type OrdenConfirmacionDto = {
  id: string;
  orden_compra_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad_ordenada: number;
  cantidad_recibida: number;
  precio_unitario: string;
  conforme: boolean | null;
  notas: string | null;
};

export type OrdenDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  proveedor_id: string;
  proveedor_nombre?: string;
  estado: EstadoOrdenCompra;
  fecha_emision: string;
  fecha_entrega_estimada: string | null;
  subtotal: string;
  igv: string;
  total: string;
  notas: string | null;
  usuario_id: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  confirmaciones?: OrdenConfirmacionDto[];
};

export type OrdenesParams = {
  estado?: EstadoOrdenCompra;
  proveedor_id?: string;
  desde?: string;
  hasta?: string;
  page?: number;
  pageSize?: number;
};

export type OrdenesListResponse = {
  success: boolean;
  data: OrdenDto[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
};

export type OrdenResponse = { success: boolean; data: OrdenDto };
