export type PortalCliente = {
  id: string;
  nombre: string;
  numero_documento: string;
};

export type PortalInstanciaImagen = {
  id: string;
  url: string;
  descripcion?: string | undefined;
};

export type PortalInstancia = {
  id: string;
  producto_id: string;
  producto_nombre?: string | undefined;
  categoria_nombre?: string | undefined;
  marca_nombre?: string | undefined;
  modelo_nombre?: string | undefined;
  numero_serie?: string | undefined;
  imagenes: PortalInstanciaImagen[];
  servicio_activo?:
    | {
        id: string;
        codigo: string;
        estado: string;
      }
    | undefined;
};

export type PortalCotizacionItem = {
  id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
  es_preventivo: boolean;
};

export type PortalEvidencia = {
  id: string;
  url: string;
  descripcion?: string | undefined;
};

export type PortalSucursal = {
  nombre: string;
  direccion?: string | undefined;
  distrito?: string | undefined;
  telefono?: string | undefined;
};

export type PortalServicio = {
  id: string;
  codigo: string;
  estado: string;
  falla_ingreso: string;
  costo_revision: string;
  canal: string;
  created_at: Date;
  updated_at: Date;
  // Cliente
  cliente_nombre?: string | undefined;
  // Instancia / Producto
  instancia_id: string;
  producto_nombre?: string | undefined;
  categoria_nombre?: string | undefined;
  marca_nombre?: string | undefined;
  numero_serie?: string | undefined;
  imagenes_instancia: PortalInstanciaImagen[];
  // Diagnóstico (COTIZADO+)
  diagnostico_tecnico?: string | undefined;
  solucion?: string | undefined;
  // Evidencias (COTIZADO+)
  evidencias: PortalEvidencia[];
  // Cotización (COTIZADO+)
  cotizacion?:
    | {
        items: PortalCotizacionItem[];
        total_correctivo: string;
        total_preventivo: string;
        total: string;
      }
    | undefined;
  // Sucursal (REPARADO/AVISADO)
  sucursal?: PortalSucursal | undefined;
  // Estado venta (AVISADO+)
  venta_estado?: string | undefined;
  // Devolución
  motivo_devolucion?: string | undefined;
  // Preventivo aceptado
  preventivo_accepted?: boolean | undefined;
};
