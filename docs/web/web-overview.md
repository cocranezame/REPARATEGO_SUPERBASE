# Web Overview — ReparaTego

> React 18 + Vite + Tailwind CSS + TanStack Query
> Web responsive (desktop first, mobile-friendly)

## Estructura de rutas

| Ruta | Módulo | Pantalla |
|------|--------|----------|
| `/login` | Seguridad | Login |
| `/` | Dashboard | Dashboard principal |
| `/usuarios` | Seguridad | CRUD usuarios |
| `/sucursales` | Seguridad | CRUD sucursales |
| `/categorias` | Catálogos | CRUD categorías |
| `/componentes` | Catálogos | CRUD componentes |
| `/marcas` | Catálogos | CRUD marcas |
| `/modelos` | Catálogos | CRUD modelos |
| `/clientes` | Clientes | Lista + detalle clientes |
| `/productos` | Inventario | CRUD productos |
| `/stock` | Inventario | Gestión de stock |
| `/proveedores` | Proveedores | CRUD proveedores |
| `/cotizaciones-compra` | Compras | Cotizaciones de compra |
| `/ordenes-compra` | Compras | Órdenes de compra |
| `/ordenes-servicio` | Servicios | Órdenes de servicio |
| `/cotizaciones-venta` | Ventas | Cotizaciones de venta |
| `/ventas` | Ventas | Ventas |
| `/domicilios` | Domicilios | Gestión domicilios |
| `/pagos-proveedor` | Pagos | Pagos a proveedores |
| `/crm` | CRM | CRM e interacciones |

## Layout

- **Sidebar:** Navegación principal, colapsable
- **Header:** Breadcrumb, usuario, sucursal activa, notificaciones
- **Content:** Área principal con scroll
- **Guard:** Protección de rutas por autenticación y rol
