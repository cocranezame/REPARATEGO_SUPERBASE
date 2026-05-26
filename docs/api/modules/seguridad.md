# API — Seguridad

> Endpoints de autenticación, usuarios, sucursales y feature flags.
> Épica: E1

## Auth

### POST /api/v1/auth/login
- Body: `{ tipo_documento, numero_documento, password }`
- Response: `{ access_token, refresh_token, user: { id, nombres, apellidos, rol, tenant_id, sucursal_id } }`
- Genera JWT con claims: tenant_id, user_id, rol, sucursal_id

### POST /api/v1/auth/refresh
- Body: `{ refresh_token }`
- Response: `{ access_token, refresh_token }`

### POST /api/v1/auth/logout
- Header: Authorization Bearer
- Invalida el refresh token

## Usuarios

### GET /api/v1/usuarios
- Query: `?search=&rol=&activo=true&page=1&pageSize=20`
- Roles permitidos: ADMIN

### POST /api/v1/usuarios
- Body: `{ tipo_documento, numero_documento, nombres, apellidos, email?, telefono?, password, rol, sucursal_id? }`
- Password se hashea con bcrypt
- Roles permitidos: ADMIN

### GET /api/v1/usuarios/:id
### PUT /api/v1/usuarios/:id
### DELETE /api/v1/usuarios/:id (soft delete: activo=false)

## Sucursales

### GET /api/v1/sucursales
### POST /api/v1/sucursales
- Body: `{ nombre, direccion?, distrito?, telefono?, es_principal }`
- Validar: solo una es_principal por tenant
### GET /api/v1/sucursales/:id
### PUT /api/v1/sucursales/:id
### DELETE /api/v1/sucursales/:id

## Feature Flags

### GET /api/v1/feature-flags
### PUT /api/v1/feature-flags/:clave
- Body: `{ habilitado: boolean }`
- Roles permitidos: ADMIN
