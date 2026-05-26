# Design System — ReparaTego

> Tokens de diseño, colores, tipografía y componentes base.
> Tailwind CSS como framework.

## Paleta de colores

```css
/* Primary — Azul ReparaTego */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-900: #1e3a5f;

/* Success — Verde */
--success-500: #22c55e;
--success-600: #16a34a;

/* Warning — Amarillo */
--warning-500: #f59e0b;
--warning-600: #d97706;

/* Danger — Rojo */
--danger-500: #ef4444;
--danger-600: #dc2626;

/* Neutral — Grises */
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-500: #64748b;
--neutral-700: #334155;
--neutral-900: #0f172a;
```

## Tailwind config (extensiones)

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: { /* azul scale */ },
      success: { /* verde scale */ },
      warning: { /* amarillo scale */ },
      danger: { /* rojo scale */ },
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
  },
}
```

## Tipografía

- **Fuente:** Inter (variable)
- **Headings:** font-semibold
- **Body:** font-normal, text-sm (14px) base
- **Mono:** JetBrains Mono (para códigos: OS-0001, PRD-0001)

## Componentes base (shared/components)

| Componente | Descripción |
|------------|-------------|
| Button | primary, secondary, danger, ghost. Tamaños: sm, md, lg. Loading state. |
| Input | text, number, tel, email. Con label, error, helper text. |
| Select | Native o custom dropdown. Con búsqueda para listas largas. |
| TextArea | Con contador de caracteres opcional. |
| Checkbox / Toggle | Para flags y opciones. |
| Badge | Para estados. Colores semánticos (verde=activo, rojo=inactivo, etc.) |
| Table | Sortable, paginación, selección. Skeleton loader. |
| Modal / Drawer | Overlay con animación. Tamaños: sm, md, lg, full. |
| Toast | success, error, warning, info. Auto-dismiss. |
| Card | Container con shadow, padding. |
| Tabs | Para vistas multi-pestaña. |
| Kanban | Columnas con drag & drop (dnd-kit). |
| Calendar | Vista semanal/diaria para técnicos. |
| FileUpload | Drag & drop + click. Preview de imágenes. |
| Breadcrumbs | Automático por ruta. |
| Sidebar | Colapsable, con iconos, badge de notificaciones. |
| SearchInput | Con debounce y autocompletado. |
| EmptyState | Ilustración + mensaje cuando no hay datos. |
| Skeleton | Placeholder animado para carga. |
| Pagination | Botones prev/next + selector de página. |

## Badges de estado

| Módulo | Estado | Color |
|--------|--------|-------|
| General | Activo | green |
| General | Inactivo | gray |
| OS | RECEPCION | blue |
| OS | EN_DIAGNOSTICO | yellow |
| OS | DIAGNOSTICADO | orange |
| OS | COTIZADO | purple |
| OS | APROBADO | cyan |
| OS | EN_REPARACION | yellow |
| OS | REPARADO | green |
| OS | LISTO_ENTREGA | emerald |
| OS | ENTREGADO | green-dark |
| OS | DEVOLUCION | red |
| OS | CANCELADO | gray |
| OC | GENERADA | blue |
| OC | ENVIADA | yellow |
| OC | TERMINADA | green |
| OC | INGRESADA | emerald |
| OC | PENDIENTE_PAGO | orange |
| Venta | PENDIENTE | yellow |
| Venta | PAGADA | green |
| Venta | PARCIAL | orange |
| Venta | ANULADA | red |
| Visita | POR_VALIDAR | gray |
| Visita | VALIDADA | blue |
| Visita | ASIGNADA | cyan |
| Visita | EN_CAMINO | yellow |
| Visita | EN_SITIO | orange |
| Visita | TERMINADA | green |
| Visita | CANCELADA | red |

## Responsive breakpoints

- **mobile:** < 640px (sidebar oculto, menú hamburguesa)
- **tablet:** 640px - 1024px (sidebar colapsado)
- **desktop:** > 1024px (sidebar expandido)

## Iconos

- Librería: Lucide React
- Tamaño estándar: 20px (w-5 h-5)
- Color: currentColor (hereda del texto)
