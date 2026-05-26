# Schema Overview — ReparaTego

> Mapa completo de las ~47 tablas, organizadas por módulo.
> Todas las tablas llevan `tenant_id` con RLS: `WHERE tenant_id = auth.jwt() ->> 'tenant_id'`
> PK: UUID con gen_random_uuid(). Timestamps: created_at, updated_at (TIMESTAMPTZ).

## Resumen por módulo

| Módulo | Tablas | Doc |
|--------|--------|-----|
| Seguridad | tenant, usuario, sucursal, feature_flag | db/modules/seguridad.md |
| Catálogos | categoria, componente, marca, modelo | db/modules/catalogos.md |
| Clientes | cliente, cliente_direccion | db/modules/clientes.md |
| Inventario | producto, producto_compatibilidad, tasa_precio, metodo_pago_catalogo, lote, movimiento_inventario | db/modules/inventario.md |
| Proveedores | proveedor, proveedor_contacto, proveedor_metodo_pago, proveedor_linea | db/modules/proveedores.md |
| Compras | cotizacion_compra, cotizacion_compra_detalle, solicitud_compra, orden_compra, orden_compra_confirmacion | db/modules/compras.md |
| Servicios | orden_servicio, orden_servicio_componente, orden_servicio_cotizacion, orden_servicio_evidencia | db/modules/servicios.md |
| Ventas | caja, venta, venta_item, venta_pago, venta_envio, cotizacion_venta, cotizacion_venta_item | db/modules/ventas.md |
| Domicilios | tarifa_distrito, visita_domicilio | db/modules/domicilios.md |
| Pagos Prov. | pago_proveedor | db/modules/pagos-proveedores.md |
| CRM | wa_cuenta, etapa_pipeline, etapa_transicion, etiqueta, lead, lead_etiqueta, conversacion, mensaje, plantilla_wa, bot, agente_config, agente_evento, mensaje_interno | db/modules/crm.md |

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
  'RECEPCION', 'EN_DIAGNOSTICO', 'DIAGNOSTICADO', 'COTIZADO', 'APROBADO',
  'EN_REPARACION', 'REPARADO', 'LISTO_ENTREGA', 'ENTREGADO', 'DEVOLUCION', 'CANCELADO'
);
CREATE TYPE tipo_servicio AS ENUM ('CORRECTIVO', 'PREVENTIVO');
CREATE TYPE momento_evidencia AS ENUM ('RECEPCION', 'DIAGNOSTICO', 'REPARACION', 'ENTREGA');

-- Ventas
CREATE TYPE tipo_venta AS ENUM ('LIBRE', 'SERVICIO', 'REVISION_DOMICILIO', 'REVISION_DEVOLUCION');
CREATE TYPE estado_venta AS ENUM ('PENDIENTE', 'PAGADA', 'PARCIAL', 'ANULADA');
CREATE TYPE tipo_comprobante AS ENUM ('BOLETA', 'FACTURA', 'NOTA_VENTA');
CREATE TYPE estado_cotizacion_venta AS ENUM ('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA');

-- Domicilios
CREATE TYPE estado_visita AS ENUM (
  'POR_VALIDAR', 'VALIDADA', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO', 'TERMINADA', 'CANCELADA'
);
```

## Relaciones clave entre módulos

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
