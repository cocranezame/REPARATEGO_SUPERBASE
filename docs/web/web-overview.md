# Web Overview — ReparaTego

> App web con React 18 + Vite + Tailwind + TanStack Query.
> Responsive-first, PWA offline-light.

## Estructura de rutas

```
/login                          → Pantalla de login (pública)

/ (layout con sidebar + header) → Requiere autenticación
├── /dashboard                  → Dashboard principal
│
├── /admin/usuarios             → CRUD usuarios (ADMIN)
├── /admin/sucursales           → CRUD sucursales (ADMIN)
├── /admin/feature-flags        → Feature flags (ADMIN)
│
├── /catalogos                  → Tabs: categorías, componentes, marcas, modelos
│
├── /clientes                   → Listado de clientes
├── /clientes/:id               → Detalle de cliente
│
├── /inventario/productos       → Listado de productos
├── /inventario/productos/nuevo → Crear producto
├── /inventario/productos/:id   → Editar producto
├── /inventario/tasas-precio    → Tasas de precio
├── /inventario/metodos-pago    → Métodos de pago catálogo
├── /inventario/lotes           → Lotes
├── /inventario/movimientos     → Historial de movimientos
│
├── /proveedores                → Listado de proveedores
├── /proveedores/:id            → Detalle de proveedor
│
├── /compras/cotizaciones       → Cotizaciones de compra
├── /compras/cotizaciones/comparar → Comparador de precios
├── /compras/solicitudes        → Solicitudes de compra
├── /compras/ordenes            → Kanban de OC
├── /compras/ordenes/:id        → Detalle de OC
├── /compras/pagos              → Pagos pendientes
│
├── /servicios                  → Listado de OS
├── /servicios/nuevo            → Recepción de equipo (wizard)
├── /servicios/:id              → Detalle de OS
│
├── /ventas/caja                → Caja (apertura/cierre)
├── /ventas/nueva               → Punto de venta
├── /ventas/historial           → Historial de ventas
├── /ventas/envios              → Gestión de envíos
├── /ventas/cotizaciones        → Cotizaciones de venta
│
├── /domicilios                 → Kanban de visitas
├── /domicilios/nueva           → Agendar visita
├── /domicilios/calendario      → Calendario de técnicos
├── /domicilios/tarifas         → Tarifas por distrito
│
├── /crm/pipeline               → Pipeline de leads (kanban)
├── /crm/leads/:id              → Detalle de lead
├── /crm/conversaciones         → Bandeja de conversaciones
├── /crm/configuracion          → Config CRM (tabs)
├── /crm/dashboard              → Dashboard CRM
├── /crm/mensajes               → Mensajería interna
│
└── /reportes                   → Reportes por módulo
```

## Estructura de componentes

```
src/
├── app/
│   ├── routes/              → Rutas (file-based o manual)
│   ├── layouts/
│   │   ├── AuthLayout.tsx   → Layout público (login)
│   │   └── MainLayout.tsx   → Layout con sidebar + header
│   └── App.tsx              → Router principal
│
├── modules/                 → Por dominio (screaming architecture)
│   ├── auth/
│   ├── catalogos/
│   ├── clientes/
│   ├── inventario/
│   ├── proveedores/
│   ├── compras/
│   ├── servicios/
│   ├── ventas/
│   ├── domicilios/
│   └── crm/
│       ├── components/      → Componentes del módulo
│       ├── hooks/           → Custom hooks (queries, mutations)
│       ├── pages/           → Páginas del módulo
│       └── types.ts         → Tipos locales
│
├── shared/
│   ├── components/          → UI compartida (Button, Input, Table, Modal, etc.)
│   ├── hooks/               → useAuth, useToast, usePagination, etc.
│   ├── lib/                 → API client (fetch wrapper), formatters, utils
│   └── stores/              → Zustand stores (auth, UI state)
│
└── styles/
    └── globals.css          → Tailwind base + custom tokens
```

## Estado global

- **Auth:** Zustand store con user, token, refresh
- **UI:** Zustand store con sidebar collapsed, theme, toasts
- **Server state:** TanStack Query para todo lo demás (cache, refetch, optimistic updates)

## Patrones

- Custom hooks por entidad: `useProductos()`, `useProducto(id)`, `useCreateProducto()`
- Formularios con React Hook Form + Zod resolver
- Tablas con TanStack Table (sorting, pagination, filters)
- Modales/drawers con estado local o URL params
- Toast notifications para feedback
- Skeleton loaders mientras carga
- Error boundaries por módulo
