# API Overview — ReparaTego

> API REST con Hono, estructura DDD ports & adapters.

## Base URL

- Local: `http://localhost:3001/api/v1`
- Producción: `https://api.reparatego.com/api/v1` (pendiente)

## Autenticación

- JWT via Supabase Auth
- Header: `Authorization: Bearer <token>`
- Middleware valida token y extrae `tenant_id` + `user_id` + `rol`

## Formato de respuesta estándar

```json
{
  "data": {},
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Formato de error

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campo requerido",
    "details": []
  },
  "meta": null
}
```

## Módulos

| Módulo | Prefijo | Doc |
|--------|---------|-----|
| Seguridad | `/auth`, `/usuarios`, `/sucursales` | docs/api/modules/seguridad.md |
| Catálogos | `/categorias`, `/componentes`, `/marcas`, `/modelos` | docs/api/modules/catalogos.md |
| Clientes | `/clientes` | docs/api/modules/clientes.md |
| Inventario | `/productos`, `/stock` | docs/api/modules/inventario.md |
| Proveedores | `/proveedores` | docs/api/modules/proveedores.md |
| Compras | `/cotizaciones-compra`, `/ordenes-compra` | docs/api/modules/compras.md |
| Servicios | `/ordenes-servicio` | docs/api/modules/servicios.md |
| Ventas | `/cotizaciones-venta`, `/ventas` | docs/api/modules/ventas.md |
| Domicilios | `/domicilios` | docs/api/modules/domicilios.md |
| Pagos | `/pagos-proveedor` | docs/api/modules/pagos-proveedores.md |
| CRM | `/crm` | docs/api/modules/crm.md |
