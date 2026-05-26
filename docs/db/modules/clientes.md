# DB — Clientes

> Tablas del módulo de clientes.
> Épica: E3

## Tablas

### cliente

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| tipo_documento | VARCHAR(3) | NO | | DNI, RUC, CE |
| numero_documento | VARCHAR(20) | NO | | |
| tipo_persona | VARCHAR(10) | NO | 'NATURAL' | NATURAL, JURIDICA |
| nombres | VARCHAR(100) | SI | | Para persona natural |
| apellidos | VARCHAR(100) | SI | | Para persona natural |
| razon_social | VARCHAR(200) | SI | | Para persona jurídica |
| email | VARCHAR(150) | SI | | |
| telefono | VARCHAR(20) | SI | | |
| telefono_secundario | VARCHAR(20) | SI | | |
| notas | TEXT | SI | | Notas internas |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, numero_documento)` UNIQUE, `(tenant_id, telefono)` para búsqueda

### cliente_direccion

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| cliente_id | UUID | NO | | FK → cliente.id |
| etiqueta | VARCHAR(50) | NO | 'PRINCIPAL' | PRINCIPAL, TRABAJO, OTRO |
| direccion | VARCHAR(255) | NO | | |
| distrito | VARCHAR(100) | SI | | |
| provincia | VARCHAR(100) | SI | | |
| departamento | VARCHAR(100) | SI | | |
| referencia | VARCHAR(255) | SI | | Referencia para llegar |
| latitud | DECIMAL(10,7) | SI | | Para domicilios |
| longitud | DECIMAL(10,7) | SI | | Para domicilios |
| es_principal | BOOLEAN | NO | false | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

## Reglas de negocio

- Búsqueda por DNI/RUC (futuro: consulta API SUNAT/RENIEC)
- Un cliente puede tener múltiples direcciones
- Solo una dirección puede ser principal por cliente
- tipo_persona determina qué campos son requeridos (nombres/apellidos vs razon_social)
