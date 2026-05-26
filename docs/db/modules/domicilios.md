# DB — Domicilios

> Tablas de visitas a domicilio y tarifas.
> Épica: E12

## Tablas

### tarifa_distrito

Tarifa de visita por distrito.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| distrito | VARCHAR(100) | NO | | Nombre del distrito |
| provincia | VARCHAR(100) | NO | 'Lima' | |
| tarifa | DECIMAL(12,2) | NO | | Costo de visita |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, distrito)` UNIQUE

### visita_domicilio

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| codigo | VARCHAR(20) | NO | | Autogenerado: VD-XXXX |
| cliente_id | UUID | NO | | FK → cliente.id |
| direccion_id | UUID | SI | | FK → cliente_direccion.id |
| direccion_texto | VARCHAR(255) | NO | | |
| distrito | VARCHAR(100) | NO | | |
| tecnico_id | UUID | SI | | FK → usuario.id |
| fecha_programada | DATE | NO | | |
| hora_inicio | TIME | SI | | |
| hora_fin | TIME | SI | | |
| estado | VARCHAR(20) | NO | 'POR_VALIDAR' | Ver enum |
| tarifa | DECIMAL(12,2) | NO | | Tarifa cobrada |
| motivo_visita | TEXT | SI | | |
| diagnostico_campo | TEXT | SI | | Lo que el técnico encuentra in situ |
| orden_servicio_id | UUID | SI | | FK → orden_servicio.id (si se genera OS) |
| venta_id | UUID | SI | | FK → venta.id (si se cancela con cobro) |
| motivo_cancelacion | TEXT | SI | | |
| notas | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## Enums

```sql
CREATE TYPE estado_visita AS ENUM (
  'POR_VALIDAR', 'VALIDADA', 'ASIGNADA', 'EN_CAMINO',
  'EN_SITIO', 'TERMINADA', 'CANCELADA'
);
```

## Flujo de estados

```
POR_VALIDAR → VALIDADA → ASIGNADA → EN_CAMINO → EN_SITIO → TERMINADA
                                                           → CANCELADA (con o sin cobro)
```

## Reglas de negocio

- Tarifa se calcula por distrito
- Disponibilidad de técnicos: no programar dos visitas en el mismo horario
- Si la visita resulta en reparación → se crea orden_servicio vinculada
- Si el cliente cancela → puede generar venta tipo REVISION_DOMICILIO por la tarifa
