export type TipoNotificacion = "PRESUPUESTO_LISTO" | "EQUIPO_LISTO" | "ENTREGA_CONFIRMADA";

export interface NotificacionServicioDatos {
  orden_servicio_id: string;
  cliente_celular?: string | null | undefined;
  cliente_nombre?: string | null | undefined;
  equipo_descripcion?: string | null | undefined;
  monto_total?: number | undefined;
  sucursal_direccion?: string | null | undefined;
}

// TODO: Integrar con EventBridge/SQS cuando esté disponible en producción
export async function emitServiceNotification(
  tipo: TipoNotificacion,
  datos: NotificacionServicioDatos
): Promise<void> {
  console.log(`[NOTIFICATION] ${tipo}:`, datos);
}
