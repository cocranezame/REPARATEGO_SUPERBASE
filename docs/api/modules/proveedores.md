# API — Proveedores

> Endpoints de proveedores y sub-recursos.
> Épica: E5

## Proveedores

### GET /api/v1/proveedores
- Query: `?search=&activo=true&page=1&pageSize=20`
- search busca en ruc, razon_social, nombre_comercial

### POST /api/v1/proveedores
- Body: `{ ruc, razon_social, nombre_comercial?, direccion?, distrito?, email?, telefono?, web?, notas?, calificacion? }`

### GET /api/v1/proveedores/:id
- Incluye contactos, métodos de pago, líneas

### PUT /api/v1/proveedores/:id
### DELETE /api/v1/proveedores/:id

## Contactos

### GET /api/v1/proveedores/:id/contactos
### POST /api/v1/proveedores/:id/contactos
- Body: `{ nombre, cargo?, telefono?, email?, es_principal }`
### PUT /api/v1/proveedores/:provId/contactos/:id
### DELETE /api/v1/proveedores/:provId/contactos/:id

## Métodos de pago

### GET /api/v1/proveedores/:id/metodos-pago
### POST /api/v1/proveedores/:id/metodos-pago
- Body: `{ tipo, banco?, numero_cuenta?, cci?, titular? }`
### PUT /api/v1/proveedores/:provId/metodos-pago/:id
### DELETE /api/v1/proveedores/:provId/metodos-pago/:id

## Líneas de producto

### GET /api/v1/proveedores/:id/lineas
### POST /api/v1/proveedores/:id/lineas
- Body: `{ categoria_id?, componente_id?, descripcion? }`
### DELETE /api/v1/proveedores/:provId/lineas/:id
