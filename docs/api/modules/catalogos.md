# API — Catálogos

> Endpoints de categorías, componentes, marcas y modelos.
> Épica: E2

## Categorías

### GET /api/v1/categorias
- Query: `?search=&activo=true&padre_id=` (si padre_id es null, devuelve raíces)
- Response incluye hijos si se solicita con `?incluir_hijos=true`

### POST /api/v1/categorias
- Body: `{ nombre, descripcion?, categoria_padre_id?, orden }`

### GET /api/v1/categorias/:id
### PUT /api/v1/categorias/:id
### DELETE /api/v1/categorias/:id

## Componentes

### GET /api/v1/componentes
- Query: `?categoria_id=&search=&activo=true`
- Cascada: al seleccionar categoría, filtra componentes de esa categoría

### POST /api/v1/componentes
- Body: `{ nombre, descripcion?, categoria_id }`

### GET /api/v1/componentes/:id
### PUT /api/v1/componentes/:id
### DELETE /api/v1/componentes/:id

## Marcas

### GET /api/v1/marcas
- Query: `?search=&activo=true`

### POST /api/v1/marcas
- Body: `{ nombre, logo_url? }`

### GET /api/v1/marcas/:id
### PUT /api/v1/marcas/:id
### DELETE /api/v1/marcas/:id

## Modelos

### GET /api/v1/modelos
- Query: `?marca_id=&categoria_id=&search=&activo=true`

### POST /api/v1/modelos
- Body: `{ nombre, marca_id, categoria_id }`

### GET /api/v1/modelos/:id
### PUT /api/v1/modelos/:id
### DELETE /api/v1/modelos/:id
