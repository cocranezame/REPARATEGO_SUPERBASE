# DB — Servicios (Órdenes de Servicio)

> Tablas del módulo de órdenes de servicio (reparaciones).
> Épica: E10

## Tablas

### orden_servicio

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(20) | NO | | Autogenerado: OS-XXXX |
| sucursal_id | UUID | NO | | FK → sucursal.id |
| cliente_id | UUID | NO | | FK → cliente.id |
| tecnico_id | UUID | SI | | FK → usuario.id (técnico asignado) |
| recibido_por_id | UUID | NO | | FK → usuario.id |
| categoria_id | UUID | NO | | FK → categoria.id (tipo de equipo) |
| marca_id | UUID | SI | | FK → marca.id |
| modelo_id | UUID | SI | | FK → modelo.id |
| serie_equipo | VARCHAR(50) | SI | | Número de serie del equipo |
| color_equipo | VARCHAR(30) | SI | | |
| estado | VARCHAR(20) | NO | 'RECEPCION' | Ver enum abajo |
| problema_reportado | TEXT | NO | | Lo que dice el cliente |
| diagnostico_tecnico | TEXT | SI | | Lo que encuentra el técnico |
| solucion_aplicada | TEXT | SI | | |
| tipo_servicio | VARCHAR(20) | NO | 'CORRECTIVO' | CORRECTIVO, PREVENTIVO |
| fecha_recepcion | TIMESTAMPTZ | NO | now() | |
| fecha_diagnostico | TIMESTAMPTZ | SI | | |
| fecha_inicio_reparacion | TIMESTAMPTZ | SI | | |
| fecha_terminado | TIMESTAMPTZ | SI | | |
| fecha_entrega | TIMESTAMPTZ | SI | | |
| prioridad | VARCHAR(10) | NO | 'NORMAL' | BAJA, NORMAL, ALTA, URGENTE |
| visita_domicilio_id | UUID | SI | | FK → visita_domicilio.id (si viene de domicilio) |
| notas_internas | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### orden_servicio_componente

Componentes afectados en la orden (preliminar al recibir, final tras diagnóstico).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| orden_servicio_id | UUID | NO | | FK → orden_servicio.id |
| componente_id | UUID | NO | | FK → componente.id |
| es_preliminar | BOOLEAN | NO | true | true=al recibir, false=tras diagnóstico |
| estado_componente | VARCHAR(20) | NO | | DAÑADO, FALTANTE, OK |
| notas | TEXT | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |

### orden_servicio_cotizacion

Cotización de reparación para el cliente (con precio congelado al momento).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| orden_servicio_id | UUID | NO | | FK → orden_servicio.id |
| producto_id | UUID | SI | | FK → producto.id (repuesto o servicio) |
| descripcion | VARCHAR(200) | NO | | |
| cantidad | INT | NO | 1 | |
| precio_unitario | DECIMAL(12,2) | NO | | Precio congelado al momento |
| subtotal | DECIMAL(12,2) | NO | | |
| tipo | VARCHAR(15) | NO | | REPUESTO, MANO_OBRA |
| aprobado_cliente | BOOLEAN | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### orden_servicio_evidencia

Fotos/videos del equipo (antes, durante, después).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| orden_servicio_id | UUID | NO | | FK → orden_servicio.id |
| url | VARCHAR(500) | NO | | URL en S3 |
| tipo_archivo | VARCHAR(10) | NO | | IMAGE, VIDEO |
| momento | VARCHAR(20) | NO | | RECEPCION, DIAGNOSTICO, REPARACION, ENTREGA |
| descripcion | VARCHAR(200) | SI | | |
| usuario_id | UUID | NO | | FK → usuario.id |
| created_at | TIMESTAMPTZ | NO | now() | |

## Enums

```sql
CREATE TYPE estado_orden_servicio AS ENUM (
  'RECEPCION', 'EN_DIAGNOSTICO', 'DIAGNOSTICADO',
  'COTIZADO', 'APROBADO', 'EN_REPARACION',
  'REPARADO', 'LISTO_ENTREGA', 'ENTREGADO',
  'DEVOLUCION', 'CANCELADO'
);
CREATE TYPE tipo_servicio AS ENUM ('CORRECTIVO', 'PREVENTIVO');
CREATE TYPE momento_evidencia AS ENUM ('RECEPCION', 'DIAGNOSTICO', 'REPARACION', 'ENTREGA');
```

## Flujo de estados

```
RECEPCION → EN_DIAGNOSTICO → DIAGNOSTICADO → COTIZADO → APROBADO
→ EN_REPARACION → REPARADO → LISTO_ENTREGA → ENTREGADO
                                             → DEVOLUCION
Cualquier estado → CANCELADO
```

## Reglas de negocio

- Fotos obligatorias al momento de RECEPCION
- Cotización con precios congelados (no cambian si el catálogo se actualiza)
- El cliente aprueba/rechaza la cotización antes de iniciar reparación
- Cada cambio de estado registra fecha + usuario
- Puede venir de una visita a domicilio (visita_domicilio_id)
