// Seguridad
export const TipoDocumento = {
  DNI: "DNI",
  RUC: "RUC",
  CE: "CE",
} as const;
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento];

export const RolUsuario = {
  ADMIN: "ADMIN",
  TECNICO: "TECNICO",
  VENDEDOR: "VENDEDOR",
  CAJERO: "CAJERO",
} as const;
export type RolUsuario = (typeof RolUsuario)[keyof typeof RolUsuario];

export const PlanTenant = {
  BASIC: "BASIC",
  PRO: "PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type PlanTenant = (typeof PlanTenant)[keyof typeof PlanTenant];

// Inventario
export const TipoProducto = {
  PRODUCTO: "PRODUCTO",
  SERVICIO: "SERVICIO",
} as const;
export type TipoProducto = (typeof TipoProducto)[keyof typeof TipoProducto];

export const TipoMovimiento = {
  INGRESO: "INGRESO",
  VENTA: "VENTA",
  SERVICIO: "SERVICIO",
  MERMA: "MERMA",
  REAJUSTE: "REAJUSTE",
  TRANSFERENCIA: "TRANSFERENCIA",
} as const;
export type TipoMovimiento = (typeof TipoMovimiento)[keyof typeof TipoMovimiento];

// Servicios
export const EstadoOrdenServicio = {
  RECEPCION: "RECEPCION",
  EN_DIAGNOSTICO: "EN_DIAGNOSTICO",
  DIAGNOSTICADO: "DIAGNOSTICADO",
  COTIZADO: "COTIZADO",
  APROBADO: "APROBADO",
  EN_REPARACION: "EN_REPARACION",
  REPARADO: "REPARADO",
  LISTO_ENTREGA: "LISTO_ENTREGA",
  ENTREGADO: "ENTREGADO",
  DEVOLUCION: "DEVOLUCION",
  CANCELADO: "CANCELADO",
} as const;
export type EstadoOrdenServicio = (typeof EstadoOrdenServicio)[keyof typeof EstadoOrdenServicio];

export const TipoServicio = {
  CORRECTIVO: "CORRECTIVO",
  PREVENTIVO: "PREVENTIVO",
} as const;
export type TipoServicio = (typeof TipoServicio)[keyof typeof TipoServicio];

export const MomentoEvidencia = {
  RECEPCION: "RECEPCION",
  DIAGNOSTICO: "DIAGNOSTICO",
  REPARACION: "REPARACION",
  ENTREGA: "ENTREGA",
} as const;
export type MomentoEvidencia = (typeof MomentoEvidencia)[keyof typeof MomentoEvidencia];

// Compras
export const EstadoOrdenCompra = {
  GENERADA: "GENERADA",
  ENVIADA: "ENVIADA",
  TERMINADA: "TERMINADA",
  INGRESADA: "INGRESADA",
  PENDIENTE_PAGO: "PENDIENTE_PAGO",
} as const;
export type EstadoOrdenCompra = (typeof EstadoOrdenCompra)[keyof typeof EstadoOrdenCompra];

export const EstadoCotizacionCompra = {
  PENDIENTE: "PENDIENTE",
  COTIZADA: "COTIZADA",
  VENCIDA: "VENCIDA",
} as const;
export type EstadoCotizacionCompra =
  (typeof EstadoCotizacionCompra)[keyof typeof EstadoCotizacionCompra];

export const PrioridadSolicitud = {
  BAJA: "BAJA",
  NORMAL: "NORMAL",
  ALTA: "ALTA",
  URGENTE: "URGENTE",
} as const;
export type PrioridadSolicitud = (typeof PrioridadSolicitud)[keyof typeof PrioridadSolicitud];

export const EstadoSolicitudCompra = {
  PENDIENTE: "PENDIENTE",
  EN_OC: "EN_OC",
  COMPLETADA: "COMPLETADA",
} as const;
export type EstadoSolicitudCompra =
  (typeof EstadoSolicitudCompra)[keyof typeof EstadoSolicitudCompra];

// Ventas
export const EstadoVenta = {
  PENDIENTE: "PENDIENTE",
  PAGADA: "PAGADA",
  PARCIAL: "PARCIAL",
  ANULADA: "ANULADA",
} as const;
export type EstadoVenta = (typeof EstadoVenta)[keyof typeof EstadoVenta];

export const TipoVenta = {
  LIBRE: "LIBRE",
  SERVICIO: "SERVICIO",
  REVISION_DOMICILIO: "REVISION_DOMICILIO",
  REVISION_DEVOLUCION: "REVISION_DEVOLUCION",
} as const;
export type TipoVenta = (typeof TipoVenta)[keyof typeof TipoVenta];

export const TipoComprobante = {
  BOLETA: "BOLETA",
  FACTURA: "FACTURA",
  NOTA_VENTA: "NOTA_VENTA",
} as const;
export type TipoComprobante = (typeof TipoComprobante)[keyof typeof TipoComprobante];

export const EstadoCotizacionVenta = {
  BORRADOR: "BORRADOR",
  ENVIADA: "ENVIADA",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
  VENCIDA: "VENCIDA",
} as const;
export type EstadoCotizacionVenta =
  (typeof EstadoCotizacionVenta)[keyof typeof EstadoCotizacionVenta];

// Domicilios
export const EstadoVisita = {
  POR_VALIDAR: "POR_VALIDAR",
  VALIDADA: "VALIDADA",
  ASIGNADA: "ASIGNADA",
  EN_CAMINO: "EN_CAMINO",
  EN_SITIO: "EN_SITIO",
  TERMINADA: "TERMINADA",
  CANCELADA: "CANCELADA",
} as const;
export type EstadoVisita = (typeof EstadoVisita)[keyof typeof EstadoVisita];
