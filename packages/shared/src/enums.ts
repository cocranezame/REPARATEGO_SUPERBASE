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
  // ASISTENTE: pendiente de migración DB — ver C018 en corrections-log
  ASISTENTE: "ASISTENTE",
  // ALMACEN: pendiente de migración DB — ver C019 en corrections-log
  ALMACEN: "ALMACEN",
} as const;
export type RolUsuario = (typeof RolUsuario)[keyof typeof RolUsuario];

export const PlanTenant = {
  BASIC: "BASIC",
  PRO: "PRO",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type PlanTenant = (typeof PlanTenant)[keyof typeof PlanTenant];

// Inventario — Tasas de precio (C004)
export const NivelTasaPrecio = {
  POR_REPUESTO: "POR_REPUESTO",
  POR_TIPO: "POR_TIPO",
  POR_COMPONENTE: "POR_COMPONENTE",
} as const;
export type NivelTasaPrecio = (typeof NivelTasaPrecio)[keyof typeof NivelTasaPrecio];

export const TipoRegistroTasa = {
  PRODUCTO: "PRODUCTO",
  SERVICIO: "SERVICIO",
} as const;
export type TipoRegistroTasa = (typeof TipoRegistroTasa)[keyof typeof TipoRegistroTasa];

export const TasaTipo = {
  PORCENTAJE: "PORCENTAJE",
  FIJO: "FIJO",
} as const;
export type TasaTipo = (typeof TasaTipo)[keyof typeof TasaTipo];

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
  VALIDACION: "VALIDACION",
  REVISION: "REVISION",
  DIAG_PRELIMINAR: "DIAG_PRELIMINAR",
  DIAG_FINAL: "DIAG_FINAL",
  COTIZADO: "COTIZADO",
  APROBADO: "APROBADO",
  AGREGAR_SKU: "AGREGAR_SKU",
  PRIORIDAD: "PRIORIDAD",
  REPARADO: "REPARADO",
  AVISADO: "AVISADO",
  ENTREGADO: "ENTREGADO",
  GARANTIA: "GARANTIA",
  DEVOLUCION: "DEVOLUCION",
} as const;
export type EstadoOrdenServicio = (typeof EstadoOrdenServicio)[keyof typeof EstadoOrdenServicio];

export const TipoServicio = {
  REPARACION: "REPARACION",
  REVISION: "REVISION",
} as const;
export type TipoServicio = (typeof TipoServicio)[keyof typeof TipoServicio];

export const CanalServicio = {
  TIENDA: "TIENDA",
  DOMICILIO: "DOMICILIO",
} as const;
export type CanalServicio = (typeof CanalServicio)[keyof typeof CanalServicio];

export const TipoAfectacion = {
  PREVENTIVO: "PREVENTIVO",
  CORRECTIVO: "CORRECTIVO",
} as const;
export type TipoAfectacion = (typeof TipoAfectacion)[keyof typeof TipoAfectacion];

export const TipoAccionComponente = {
  REPARACION: "REPARACION",
  CAMBIO: "CAMBIO",
} as const;
export type TipoAccionComponente = (typeof TipoAccionComponente)[keyof typeof TipoAccionComponente];

export const EtapaComponente = {
  PRELIMINAR: "PRELIMINAR",
  FINAL: "FINAL",
} as const;
export type EtapaComponente = (typeof EtapaComponente)[keyof typeof EtapaComponente];

export const TipoItemCotizacion = {
  REPUESTO: "REPUESTO",
  SERVICIO: "SERVICIO",
  MANUAL: "MANUAL",
} as const;
export type TipoItemCotizacion = (typeof TipoItemCotizacion)[keyof typeof TipoItemCotizacion];

export const EstadoSkuAsignado = {
  ASIGNADO: "ASIGNADO",
  CONSUMIDO: "CONSUMIDO",
} as const;
export type EstadoSkuAsignado = (typeof EstadoSkuAsignado)[keyof typeof EstadoSkuAsignado];

export const EstadoRequerimiento = {
  PENDIENTE: "PENDIENTE",
  EN_COMPRA: "EN_COMPRA",
  ATENDIDO: "ATENDIDO",
  ANULADO: "ANULADO",
} as const;
export type EstadoRequerimiento = (typeof EstadoRequerimiento)[keyof typeof EstadoRequerimiento];

export const TipoAceptacion = {
  VALIDACION: "VALIDACION",
  PRESUPUESTO: "PRESUPUESTO",
} as const;
export type TipoAceptacion = (typeof TipoAceptacion)[keyof typeof TipoAceptacion];

export const CanalAceptacion = {
  PORTAL_CLIENTE: "PORTAL_CLIENTE",
  MANUAL_TIENDA: "MANUAL_TIENDA",
  MANUAL_WHATSAPP: "MANUAL_WHATSAPP",
} as const;
export type CanalAceptacion = (typeof CanalAceptacion)[keyof typeof CanalAceptacion];

export const MotivoDevolucion = {
  CLIENTE_CANCELO: "CLIENTE_CANCELO",
  SIN_SOLUCION: "SIN_SOLUCION",
} as const;
export type MotivoDevolucion = (typeof MotivoDevolucion)[keyof typeof MotivoDevolucion];

export const MetodoAceptacion = {
  CLICK_BUTTON: "CLICK_BUTTON",
  FIRMA_DIGITAL: "FIRMA_DIGITAL",
  CHECKBOX: "CHECKBOX",
} as const;
export type MetodoAceptacion = (typeof MetodoAceptacion)[keyof typeof MetodoAceptacion];

// Pagos a proveedores
export const MetodoPagoProveedor = {
  TRANSFERENCIA: "TRANSFERENCIA",
  EFECTIVO: "EFECTIVO",
  CHEQUE: "CHEQUE",
} as const;
export type MetodoPagoProveedor = (typeof MetodoPagoProveedor)[keyof typeof MetodoPagoProveedor];

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

// Ventas (C003)
export const TipoVenta = {
  LIBRE: "LIBRE",
  SERVICIO: "SERVICIO",
  REVISION_DOMICILIO: "REVISION_DOMICILIO",
  REVISION_DEVOLUCION: "REVISION_DEVOLUCION",
} as const;
export type TipoVenta = (typeof TipoVenta)[keyof typeof TipoVenta];

export const EstadoCaja = {
  ABIERTA: "ABIERTA",
  CERRADA: "CERRADA",
} as const;
export type EstadoCaja = (typeof EstadoCaja)[keyof typeof EstadoCaja];

export const EstadoPagoVenta = {
  PAGO_PENDIENTE: "PAGO_PENDIENTE",
  COMPLETADA: "COMPLETADA",
  ANULADA: "ANULADA",
} as const;
export type EstadoPagoVenta = (typeof EstadoPagoVenta)[keyof typeof EstadoPagoVenta];

export const EstadoDespachoVenta = {
  SIN_ENVIO: "SIN_ENVIO",
  ENVIO_PENDIENTE: "ENVIO_PENDIENTE",
  DESPACHADO: "DESPACHADO",
} as const;
export type EstadoDespachoVenta = (typeof EstadoDespachoVenta)[keyof typeof EstadoDespachoVenta];

export const TipoItemVenta = {
  PRODUCTO: "PRODUCTO",
  SERVICIO: "SERVICIO",
  ENVIO: "ENVIO",
  MANUAL: "MANUAL",
} as const;
export type TipoItemVenta = (typeof TipoItemVenta)[keyof typeof TipoItemVenta];

export const EstadoEnvioVenta = {
  PENDIENTE: "PENDIENTE",
  DESPACHADO: "DESPACHADO",
} as const;
export type EstadoEnvioVenta = (typeof EstadoEnvioVenta)[keyof typeof EstadoEnvioVenta];

export const MetodoPago = {
  EFECTIVO: "EFECTIVO",
  YAPE: "YAPE",
  PLIN: "PLIN",
  TRANSFERENCIA: "TRANSFERENCIA",
  TARJETA: "TARJETA",
} as const;
export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

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
