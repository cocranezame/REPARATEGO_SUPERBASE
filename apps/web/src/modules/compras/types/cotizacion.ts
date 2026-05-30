export type EstadoCotizacion = "PENDIENTE" | "COTIZADA" | "VENCIDA";

export type CotizacionDetalleDto = {
  id: string;
  tenant_id: string;
  cotizacion_compra_id: string;
  producto_id: string;
  producto_nombre?: string | null;
  cantidad: number;
  precio_unitario: string | null;
  subtotal: string | null;
  notas: string | null;
  created_at: string;
};

export type CotizacionDto = {
  id: string;
  tenant_id: string;
  codigo: string;
  proveedor_id: string;
  proveedor_nombre?: string | null;
  estado: EstadoCotizacion;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  fecha_vencimiento: string | null;
  notas: string | null;
  usuario_id: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
  detalles?: CotizacionDetalleDto[];
};

export type CotizacionesListResponse = {
  success: true;
  data: CotizacionDto[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
};

export type CotizacionResponse = {
  success: true;
  data: CotizacionDto;
};

export type CotizacionesParams = {
  proveedor_id?: string;
  estado?: EstadoCotizacion;
  page?: number;
  pageSize?: number;
};
