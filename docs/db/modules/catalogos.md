# DB — Catálogos

> Tablas maestras de catálogos.
> Épica: E2

## Tablas

### categoria

Tipo de dispositivo o equipo (celular, laptop, TV, electrodoméstico, etc.)

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(100) | NO | | Nombre de categoría |
| descripcion | TEXT | SI | | |
| categoria_padre_id | UUID | SI | | FK → categoria.id (jerárquica) |
| orden | INT | NO | 0 | Orden de visualización |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, nombre)` UNIQUE

### componente

Pieza/repuesto genérico (pantalla, batería, placa madre, etc.)

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| categoria_id | UUID | NO | | FK → categoria.id |
| nombre | VARCHAR(100) | NO | | |
| descripcion | TEXT | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, categoria_id, nombre)` UNIQUE

### marca

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(100) | NO | | Samsung, Apple, LG, etc. |
| logo_url | VARCHAR(500) | SI | | URL de logo en S3 |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, nombre)` UNIQUE

### modelo

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| marca_id | UUID | NO | | FK → marca.id |
| categoria_id | UUID | NO | | FK → categoria.id |
| nombre | VARCHAR(100) | NO | | Galaxy S24, iPhone 15, etc. |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, marca_id, nombre)` UNIQUE

## Relaciones

- componente → categoria (N:1)
- modelo → marca (N:1)
- modelo → categoria (N:1)
- categoria → categoria (auto-referencia, jerárquica)

## Reglas de negocio

- Categorías son jerárquicas (padre/hijo opcional)
- Componentes se asocian a categorías (ej: "Pantalla" pertenece a "Celular")
- Modelos pertenecen a una marca Y una categoría
- Todos los catálogos son por tenant
