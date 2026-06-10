// C029: cotización simplificada = proveedor × repuesto × precio

export type CotizacionDto = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  proveedor_nombre?: string | null;
  producto_id: string;
  producto_nombre?: string | null;
  precio_unitario: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
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
  producto_id?: string;
  page?: number;
  pageSize?: number;
};
