# Convenciones — ReparaTego

## Commits

Conventional Commits obligatorio:
- `feat(modulo): descripción` — nueva funcionalidad
- `fix(modulo): descripción` — corrección de bug
- `docs(modulo): descripción` — documentación
- `chore(modulo): descripción` — mantenimiento
- `refactor(modulo): descripción` — refactorización sin cambio funcional
- `test(modulo): descripción` — tests

Módulos válidos: `infra`, `seguridad`, `catalogos`, `clientes`, `inventario`, `proveedores`, `compras`, `servicios`, `ventas`, `domicilios`, `pagos`, `crm`, `shared`, `db`, `api`, `web`

## Naming

- **Archivos/carpetas:** kebab-case (`crear-usuario.ts`)
- **Variables/funciones:** camelCase (`crearUsuario`)
- **Tipos/Interfaces:** PascalCase (`Usuario`, `CrearUsuarioInput`)
- **Constantes:** UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Tablas DB:** snake_case (`orden_servicio`)
- **Columnas DB:** snake_case (`fecha_creacion`)
- **Enums DB:** UPPER_SNAKE_CASE valores (`ACTIVO`, `INACTIVO`)

## Código

- TypeScript estricto (`strict: true`)
- Biome para lint + format
- No `any` — usar `unknown` si es necesario
- Zod para validación de inputs (schemas compartidos en `@kallpasoft/validators`)
- Errores tipados con clases custom
- Funciones puras en dominio, side effects en infraestructura

## API

- Rutas: `/api/v1/{modulo}/{recurso}`
- Respuestas: `{ data, error, meta }` consistente
- Errores HTTP estándar con body tipado
- Paginación cursor-based para listas

## Base de datos

- Todas las tablas tienen: `id` (UUID), `tenant_id`, `created_at`, `updated_at`, `activo` (soft delete)
- RLS obligatorio en todas las tablas
- Migraciones versionadas con Drizzle Kit
- Índices en columnas de búsqueda frecuente
