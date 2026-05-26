# Schema Overview — ReparaTego

> Mapa general de tablas por módulo. Detalle en docs/db/modules/{modulo}.md

## Convenciones globales

Todas las tablas tienen:
- `id` — UUID, PK, default gen_random_uuid()
- `tenant_id` — UUID, FK a tenant, NOT NULL
- `created_at` — TIMESTAMPTZ, default now()
- `updated_at` — TIMESTAMPTZ, default now()
- `activo` — BOOLEAN, default true (soft delete)

RLS habilitado en todas las tablas, filtrado por `tenant_id`.

## Módulos y tablas

| Módulo | Tablas |
|--------|--------|
| Seguridad | `tenant`, `usuario`, `sucursal`, `feature_flag` |
| Catálogos | `categoria`, `componente`, `marca`, `modelo` |
| Clientes | `cliente`, `cliente_direccion` |
| Inventario | `producto`, `producto_imagen`, `stock`, `movimiento_stock` |
| Proveedores | `proveedor`, `proveedor_contacto` |
| Compras | `cotizacion_compra`, `cotizacion_compra_detalle`, `orden_compra`, `orden_compra_detalle` |
| Servicios | `orden_servicio`, `orden_servicio_detalle`, `orden_servicio_evidencia`, `diagnostico` |
| Ventas | `cotizacion_venta`, `cotizacion_venta_detalle`, `venta`, `venta_detalle` |
| Domicilios | `domicilio`, `domicilio_seguimiento` |
| Pagos proveedores | `pago_proveedor`, `pago_proveedor_detalle` |
| CRM | `interaccion_cliente`, `seguimiento` |
