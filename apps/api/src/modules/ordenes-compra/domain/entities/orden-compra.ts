export type EstadoOrdenCompra =
  | "GENERADA"
  | "ENVIADA"
  | "TERMINADA"
  | "INGRESADA"
  | "PENDIENTE_PAGO";

export type OrdenCompraConfirmacion = {
  id: string;
  tenant_id: string;
  orden_compra_id: string;
  producto_id: string;
  producto_nombre?: string;
  cantidad_ordenada: number;
  cantidad_recibida: number;
  precio_unitario: string;
  conforme: boolean | null;
  notas: string | null;
  created_at: Date;
  updated_at: Date;
};

export type OrdenCompra = {
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
  created_at: Date;
  updated_at: Date;
  confirmaciones?: OrdenCompraConfirmacion[];
};
