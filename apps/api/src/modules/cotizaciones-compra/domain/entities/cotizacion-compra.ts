// C029: cotización = proveedor × repuesto × precio_unitario

export type CotizacionCompra = {
  id: string;
  tenant_id: string;
  proveedor_id: string;
  proveedor_nombre?: string | null;
  producto_id: string;
  producto_nombre?: string | null;
  precio_unitario: string | null;
  notas: string | null;
  created_at: Date;
  updated_at: Date;
};
