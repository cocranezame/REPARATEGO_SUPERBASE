# API — Clientes

> Endpoints de clientes y sus direcciones.
> Épica: E3

## Clientes

### GET /api/v1/clientes
- Query: `?search=&tipo_documento=&tipo_persona=&activo=true&page=1&pageSize=20`
- search busca en numero_documento, nombres, apellidos, razon_social, telefono

### POST /api/v1/clientes
- Body: `{ tipo_documento, numero_documento, tipo_persona, nombres?, apellidos?, razon_social?, email?, telefono?, telefono_secundario?, notas? }`
- Validar: si NATURAL → nombres+apellidos required. Si JURIDICA → razon_social required.

### GET /api/v1/clientes/:id
- Incluye direcciones

### PUT /api/v1/clientes/:id
### DELETE /api/v1/clientes/:id

### GET /api/v1/clientes/buscar-documento?tipo=DNI&numero=12345678
- Busca por documento exacto (útil para verificar si ya existe)

## Direcciones

### GET /api/v1/clientes/:id/direcciones
### POST /api/v1/clientes/:id/direcciones
- Body: `{ etiqueta, direccion, distrito?, provincia?, departamento?, referencia?, latitud?, longitud?, es_principal }`

### PUT /api/v1/clientes/:clienteId/direcciones/:id
### DELETE /api/v1/clientes/:clienteId/direcciones/:id
