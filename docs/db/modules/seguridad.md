# DB — Seguridad

> Tablas del módulo de seguridad y acceso.
> Épica: E1

## Tablas

### tenant

Empresa/negocio que usa el sistema. Aísla todos los datos.

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| nombre | VARCHAR(100) | NO | | Nombre del negocio |
| ruc | VARCHAR(11) | SI | | RUC del negocio |
| plan | VARCHAR(20) | NO | 'BASIC' | BASIC, PRO, ENTERPRISE |
| activo | BOOLEAN | NO | true | Soft delete |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### usuario

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| sucursal_id | UUID | SI | | FK → sucursal.id (sucursal principal) |
| tipo_documento | VARCHAR(3) | NO | | DNI, RUC, CE |
| numero_documento | VARCHAR(20) | NO | | Número de documento |
| nombres | VARCHAR(100) | NO | | |
| apellidos | VARCHAR(100) | NO | | |
| email | VARCHAR(150) | SI | | |
| telefono | VARCHAR(20) | SI | | |
| password_hash | VARCHAR(255) | NO | | bcrypt hash |
| rol | VARCHAR(20) | NO | | ADMIN, TECNICO, VENDEDOR, CAJERO |
| ultimo_login | TIMESTAMPTZ | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, numero_documento)` UNIQUE, `(tenant_id, email)` UNIQUE WHERE email IS NOT NULL

**RLS:** WHERE tenant_id = auth.jwt() ->> 'tenant_id'

### sucursal

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(100) | NO | | Nombre de la sucursal |
| direccion | VARCHAR(255) | SI | | |
| distrito | VARCHAR(100) | SI | | |
| telefono | VARCHAR(20) | SI | | |
| es_principal | BOOLEAN | NO | false | Una sola por tenant |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### feature_flag

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| clave | VARCHAR(50) | NO | | Ej: MODULO_CRM, MODULO_DOMICILIOS |
| habilitado | BOOLEAN | NO | false | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, clave)` UNIQUE

## Enums

```sql
CREATE TYPE tipo_documento AS ENUM ('DNI', 'RUC', 'CE');
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'TECNICO', 'VENDEDOR', 'CAJERO');
CREATE TYPE plan_tenant AS ENUM ('BASIC', 'PRO', 'ENTERPRISE');
```

## Reglas de negocio

- Login por numero_documento + password (no por email)
- Un usuario puede tener una sucursal principal asignada
- ADMIN tiene acceso total
- Feature flags habilitan/deshabilitan módulos por tenant
- Solo un `es_principal = true` por tenant en sucursales
