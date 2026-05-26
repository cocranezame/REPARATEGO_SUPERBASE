# API Overview — ReparaTego

> API REST con Hono sobre AWS Lambda (Node 20).
> Arquitectura: DDD ports & adapters + screaming architecture.

## Estructura de rutas

```
/api/v1
├── /auth
│   ├── POST   /login              → Login con numero_doc + password
│   ├── POST   /refresh            → Refresh token
│   └── POST   /logout             → Invalidar sesión
│
├── /usuarios                       → CRUD usuarios (ADMIN)
├── /sucursales                     → CRUD sucursales (ADMIN)
├── /feature-flags                  → CRUD feature flags (ADMIN)
│
├── /categorias                     → CRUD categorías (jerárquicas)
├── /componentes                    → CRUD componentes
├── /marcas                         → CRUD marcas
├── /modelos                        → CRUD modelos
│
├── /clientes                       → CRUD clientes + búsqueda DNI/RUC
├── /clientes/:id/direcciones       → CRUD direcciones
│
├── /productos                      → CRUD productos + servicios
├── /productos/:id/compatibilidades → Gestión compatibilidades por modelo
├── /tasas-precio                   → CRUD tasas de precio
├── /metodos-pago                   → CRUD métodos de pago catálogo
│
├── /proveedores                    → CRUD proveedores
├── /proveedores/:id/contactos      → CRUD contactos
├── /proveedores/:id/metodos-pago   → CRUD métodos pago proveedor
├── /proveedores/:id/lineas         → CRUD líneas de producto
│
├── /cotizaciones-compra            → CRUD cotizaciones de compra
├── /solicitudes-compra             → CRUD solicitudes de compra
├── /ordenes-compra                 → CRUD órdenes de compra
├── /ordenes-compra/:id/confirmar   → Confirmación de items
├── /pagos-proveedor                → Registrar pagos a proveedores
│
├── /stock                          → Consulta de stock (SUM movimientos)
├── /lotes                          → Listado de lotes
├── /movimientos                    → Historial de movimientos
│
├── /ordenes-servicio               → CRUD órdenes de servicio
├── /ordenes-servicio/:id/componentes    → Componentes afectados
├── /ordenes-servicio/:id/cotizacion     → Cotización al cliente
├── /ordenes-servicio/:id/evidencias     → Upload/listado de evidencias
├── /ordenes-servicio/:id/estado         → Cambio de estado
│
├── /cajas                          → Apertura/cierre de caja
├── /ventas                         → CRUD ventas
├── /ventas/:id/pagos               → Registrar pagos
├── /ventas/:id/envio               → Gestión de envío
├── /cotizaciones-venta             → Cotizaciones referenciales
│
├── /visitas-domicilio              → CRUD visitas
├── /visitas-domicilio/:id/estado   → Cambio de estado
├── /tarifas-distrito               → CRUD tarifas por distrito
├── /tecnicos/disponibilidad        → Consulta disponibilidad
│
├── /crm/wa-cuentas                 → Config cuentas WhatsApp
├── /crm/etapas                     → CRUD etapas pipeline
├── /crm/etiquetas                  → CRUD etiquetas
├── /crm/leads                      → CRUD leads
├── /crm/conversaciones             → Listado/detalle conversaciones
├── /crm/mensajes                   → Envío de mensajes
├── /crm/plantillas                 → CRUD plantillas WA
├── /crm/bots                       → CRUD bots
├── /crm/agente                     → Config agente Nico
├── /crm/mensajes-internos          → Mensajería interna
│
├── /webhook/whatsapp               → Webhook Meta WhatsApp
│
├── /dashboard                      → Métricas consolidadas
└── /reportes                       → Reportes por módulo
```

## Middlewares

1. **cors** — Orígenes permitidos (web app)
2. **requestId** — UUID por request para trazabilidad
3. **logger** — AWS Powertools logger
4. **auth** — Valida JWT, extrae tenant_id + user_id + rol
5. **authorize(roles[])** — Verifica rol del usuario
6. **validate(schema)** — Valida body/params/query con Zod
7. **errorHandler** — Manejo centralizado de errores

## Patrón DDD (por módulo)

```
src/modules/{modulo}/
├── domain/
│   ├── entities/        → Tipos e interfaces del dominio
│   ├── ports/           → Interfaces (repository, services)
│   └── use-cases/       → Lógica de negocio pura
├── infra/
│   ├── repositories/    → Implementación Drizzle de los ports
│   └── services/        → Servicios externos (S3, WhatsApp, etc.)
├── http/
│   ├── routes.ts        → Definición de rutas Hono
│   ├── handlers.ts      → Handlers HTTP (delegan a use-cases)
│   └── validators.ts    → Schemas Zod para request/response
└── index.ts             → Barrel export
```

## Respuestas estándar

```typescript
// Éxito
{ success: true, data: T }

// Éxito paginado
{ success: true, data: T[], meta: { total, page, pageSize, totalPages } }

// Error
{ success: false, error: { code: string, message: string, details?: any } }
```

## Códigos de error

| Código | HTTP | Descripción |
|--------|------|-------------|
| AUTH_INVALID_CREDENTIALS | 401 | Login fallido |
| AUTH_TOKEN_EXPIRED | 401 | Token expirado |
| AUTH_FORBIDDEN | 403 | Sin permisos |
| VALIDATION_ERROR | 400 | Schema inválido |
| NOT_FOUND | 404 | Recurso no existe |
| CONFLICT | 409 | Duplicado (unique constraint) |
| BUSINESS_RULE | 422 | Regla de negocio violada |
| INTERNAL_ERROR | 500 | Error interno |

## Paginación

Query params estándar: `?page=1&pageSize=20&sort=created_at&order=desc`

## Filtros

Cada listado tiene sus propios filtros por query params. Ej:
- `/productos?tipo=PRODUCTO&categoria_id=xxx&search=pantalla`
- `/ordenes-servicio?estado=EN_REPARACION&tecnico_id=xxx&desde=2026-01-01`
