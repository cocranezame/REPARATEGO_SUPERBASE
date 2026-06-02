# Schema Overview — ReparaTego

> Mapa completo de las ~56 tablas, organizadas por módulo.
> Todas las tablas llevan `tenant_id` con RLS: `WHERE tenant_id = auth.jwt() ->> 'tenant_id'`
> PK: UUID con gen_random_uuid(). Timestamps: created_at, updated_at (TIMESTAMPTZ).

## Resumen por módulo

| Módulo | Tablas | Doc |
|--------|--------|-----|
| Seguridad | tenant, usuario, sucursal, feature_flag | db/modules/seguridad.md |
| Catálogos | categoria, componente, marca, modelo | db/modules/catalogos.md |
| Clientes | cliente, cliente_direccion | db/modules/clientes.md |
| Inventario | producto, producto_compatibilidad, tasa_precio, metodo_pago_catalogo, lote, movimiento_inventario — *Actualizado por C004: campo stock_minimo en producto, campo correlativo en lote, tabla tasa_precio refactorizada con jerarquía de 3 niveles (POR_REPUESTO, POR_TIPO, POR_COMPONENTE)* | db/modules/inventario.md |
| Proveedores | proveedor, proveedor_contacto, proveedor_metodo_pago, proveedor_linea | db/modules/proveedores.md |
| Compras | cotizacion_compra, cotizacion_compra_detalle, solicitud_compra, orden_compra, orden_compra_confirmacion | db/modules/compras.md |
| Servicios | instancia, instancia_imagen, periferico, costo_revision, orden_servicio, orden_servicio_periferico, orden_servicio_componente, orden_servicio_cotizacion, orden_servicio_evidencia, orden_servicio_sku_asignado, orden_servicio_requerimiento, orden_servicio_aceptacion, orden_servicio_historial, orden_servicio_observacion | db/modules/servicios.md |
| Ventas | caja, metodo_pago_catalogo, venta, venta_item, venta_pago, venta_envio, cotizacion_venta, cotizacion_venta_item — *Actualizado por C003: campos anulado_por, nota_credito_monto en venta; campo sku en venta_item* | db/modules/ventas.md |
| Domicilios | tarifa_distrito, visita_domicilio | db/modules/domicilios.md |
| Pagos Prov. | pago_proveedor | db/modules/pagos-proveedores.md |
| CRM | wa_cuenta, crm_etapa, crm_etapa_transicion, crm_etiqueta, crm_lead, crm_lead_etiqueta, crm_conversacion, crm_mensaje, crm_nota, crm_agente, crm_accion_agente, crm_plantilla, crm_bot, crm_evento, crm_mensaje_interno — *Actualizado por C005: campos UTM (C001) en crm_lead, webhook_verify_token en wa_cuenta, bot_id en crm_etapa, campos metadata y mensajes_sin_leer, asignado_por en crm_lead_etiqueta, prompt_base y max_mensajes_contexto en crm_agente, meta_template_name en crm_plantilla, codigo en crm_etiqueta y crm_bot* | db/modules/crm.md |

## Enums globales

```sql
-- Seguridad
CREATE TYPE tipo_documento AS ENUM ('DNI', 'RUC', 'CE');
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'TECNICO', 'VENDEDOR', 'CAJERO');
CREATE TYPE plan_tenant AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');

-- Inventario
CREATE TYPE tipo_producto AS ENUM ('PRODUCTO', 'SERVICIO');
CREATE TYPE tipo_movimiento AS ENUM ('INGRESO', 'VENTA', 'SERVICIO', 'MERMA', 'REAJUSTE', 'TRANSFERENCIA');

-- Compras
CREATE TYPE estado_cotizacion_compra AS ENUM ('PENDIENTE', 'COTIZADA', 'VENCIDA');
CREATE TYPE prioridad_solicitud AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');
CREATE TYPE estado_solicitud_compra AS ENUM ('PENDIENTE', 'EN_OC', 'COMPLETADA');
CREATE TYPE estado_orden_compra AS ENUM ('GENERADA', 'ENVIADA', 'TERMINADA', 'INGRESADA', 'PENDIENTE_PAGO');

-- Servicios
CREATE TYPE estado_orden_servicio AS ENUM (
  'VALIDACION', 'REVISION', 'DIAG_PRELIMINAR', 'DIAG_FINAL', 'COTIZADO', 'APROBADO',
  'AGREGAR_SKU', 'PRIORIDAD', 'REPARADO', 'AVISADO', 'ENTREGADO', 'GARANTIA', 'DEVOLUCION'
);
CREATE TYPE tipo_servicio AS ENUM ('REPARACION', 'REVISION');
CREATE TYPE canal_servicio AS ENUM ('TIENDA', 'DOMICILIO');
CREATE TYPE tipo_afectacion AS ENUM ('PREVENTIVO', 'CORRECTIVO');
CREATE TYPE tipo_accion_componente AS ENUM ('REPARACION', 'CAMBIO');
CREATE TYPE tipo_item_cotizacion AS ENUM ('REPUESTO', 'SERVICIO', 'MANUAL');
CREATE TYPE estado_sku_asignado AS ENUM ('ASIGNADO', 'CONSUMIDO');
CREATE TYPE estado_requerimiento AS ENUM ('PENDIENTE', 'EN_COMPRA', 'ATENDIDO', 'ANULADO');
CREATE TYPE tipo_aceptacion AS ENUM ('VALIDACION', 'PRESUPUESTO');
CREATE TYPE canal_aceptacion AS ENUM ('PORTAL_CLIENTE', 'MANUAL_TIENDA', 'MANUAL_WHATSAPP');

-- Ventas
CREATE TYPE tipo_venta AS ENUM ('LIBRE', 'SERVICIO', 'REVISION_DOMICILIO', 'REVISION_DEVOLUCION');
CREATE TYPE estado_pago AS ENUM ('PAGO_PENDIENTE', 'COMPLETADA', 'ANULADA');
CREATE TYPE estado_despacho AS ENUM ('SIN_ENVIO', 'ENVIO_PENDIENTE', 'DESPACHADO');
CREATE TYPE tipo_item_venta AS ENUM ('PRODUCTO', 'SERVICIO', 'ENVIO', 'MANUAL');
CREATE TYPE estado_cotizacion_venta AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA');

-- Domicilios
CREATE TYPE estado_visita AS ENUM (
  'POR_VALIDAR', 'VALIDADA', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO', 'TERMINADA', 'CANCELADA'
);

-- CRM (C005)
CREATE TYPE modo_conversacion AS ENUM ('NICO', 'VENDEDOR');
CREATE TYPE estado_conversacion AS ENUM ('ACTIVA', 'CERRADA');
CREATE TYPE direccion_mensaje AS ENUM ('ENTRANTE', 'SALIENTE');
CREATE TYPE origen_mensaje AS ENUM ('CLIENTE', 'AGENTE', 'VENDEDOR', 'BOT', 'SISTEMA');
CREATE TYPE tipo_mensaje AS ENUM ('TEXTO', 'IMAGEN', 'PLANTILLA', 'LINK');
CREATE TYPE grupo_etiqueta AS ENUM ('IDENTIFICACION', 'RUTA_ACTIVA', 'CAPTURA_DATOS', 'ESTADO_OPERATIVO');
CREATE TYPE operador_etapa AS ENUM ('IA', 'BOT', 'HUMANO', 'SISTEMA');
CREATE TYPE tipo_bot AS ENUM ('COTIZACION_REPUESTO', 'SERVICIO_PROCESO', 'RECORDATORIO');
CREATE TYPE estado_meta_plantilla AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');
CREATE TYPE origen_nota AS ENUM ('NICO', 'VENDEDOR');
CREATE TYPE origen_evento AS ENUM ('SISTEMA', 'NICO', 'VENDEDOR', 'BOT');
CREATE TYPE asignado_por_etiqueta AS ENUM ('NICO', 'VENDEDOR', 'SISTEMA');
```

## Relaciones clave entre módulos

- **Clientes ↔ Servicios:** cliente 1:N instancia 1:N orden_servicio (el cliente se obtiene vía instancia, nunca directo desde orden_servicio)
- **Catálogos ↔ Servicios:** producto 1:N instancia (un modelo genérico tiene muchas instancias físicas de distintos clientes)
- **Inventario ↔ Compras:** lote.orden_compra_id → orden_compra.id (al confirmar OC se crean lotes)
- **Inventario ↔ Ventas:** movimiento_inventario con referencia_tipo=VENTA → venta.id
- **Inventario ↔ Servicios:** movimiento_inventario con referencia_tipo=ORDEN_SERVICIO → orden_servicio.id
- **Servicios ↔ Ventas:** venta.orden_servicio_id → orden_servicio.id (cobro de servicio)
- **Servicios ↔ Domicilios:** orden_servicio.visita_domicilio_id → visita_domicilio.id
- **Domicilios ↔ Ventas:** visita_domicilio.venta_id → venta.id (cobro por cancelación)
- **CRM ↔ Clientes:** lead.cliente_id → cliente.id
- **Compras ↔ Pagos:** pago_proveedor.orden_compra_id → orden_compra.id

## Convenciones

- Todas las tablas: `id UUID PK`, `tenant_id UUID NOT NULL`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
- Soft delete: `activo BOOLEAN DEFAULT true` (no se borran registros)
- Códigos autogenerados: PRD-XXXX, SRV-XXXX, OS-XXXX, OC-XXXX, V-XXXX, COT-C-XXXX, COT-V-XXXX, VD-XXXX
- Montos: DECIMAL(12,2) en PEN (soles)
- RLS en todas las tablas por tenant_id
