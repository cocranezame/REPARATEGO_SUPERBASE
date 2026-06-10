# DB — Proveedores

> Tablas del módulo de proveedores.
> Épica: E5

## Tablas

### condicion_pago

Catálogo de plazos de pago pactados con proveedores. *Agregado C030.*

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| nombre | VARCHAR(100) | NO | | "Contado", "30 días", etc. |
| dias_credito | INT | NO | 0 | 0 = pago al contado |
| es_default | BOOLEAN | NO | false | Solo uno por tenant |
| activo | BOOLEAN | NO | true | Soft-delete |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, nombre)` UNIQUE

### proveedor

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| ruc | VARCHAR(11) | NO | | RUC del proveedor |
| razon_social | VARCHAR(200) | NO | | |
| nombre_comercial | VARCHAR(200) | SI | | |
| contacto_nombre | VARCHAR(100) | SI | | Nombre del contacto principal |
| telefono | VARCHAR(20) | SI | | |
| telefono2 | VARCHAR(20) | SI | | Teléfono secundario |
| telefono3 | VARCHAR(20) | SI | | Tercer teléfono de contacto |
| email | VARCHAR(150) | SI | | |
| direccion | VARCHAR(255) | SI | | |
| departamento | VARCHAR(100) | SI | | Departamento del país (texto libre) |
| distrito | VARCHAR(100) | SI | | |
| condicion_pago_id | UUID | SI | | FK → condicion_pago.id |
| web | VARCHAR(255) | SI | | |
| notas | TEXT | SI | | Notas internas |
| observaciones | TEXT | SI | | Observaciones adicionales |
| calificacion | INT | SI | | 1-5 estrellas |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

**Índices:** `(tenant_id, ruc)` UNIQUE

### proveedor_contacto

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| proveedor_id | UUID | NO | | FK → proveedor.id |
| nombre | VARCHAR(100) | NO | | |
| cargo | VARCHAR(100) | SI | | |
| telefono | VARCHAR(20) | SI | | |
| email | VARCHAR(150) | SI | | |
| es_principal | BOOLEAN | NO | false | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### proveedor_metodo_pago

Métodos de pago que acepta el proveedor (cuentas bancarias, etc.)

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| proveedor_id | UUID | NO | | FK → proveedor.id |
| tipo_cuenta | VARCHAR(20) | SI | | Grupo: "banco" o "monedero" |
| tipo | VARCHAR(30) | NO | | CUENTA_CORRIENTE, CUENTA_AHORRO, YAPE, PLIN |
| banco | VARCHAR(50) | SI | | BCP, BBVA, Interbank, etc. |
| numero_cuenta | VARCHAR(30) | SI | | |
| cci | VARCHAR(25) | SI | | Código Cuenta Interbancario |
| titular | VARCHAR(150) | SI | | |
| activo | BOOLEAN | NO | true | |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | |

### proveedor_linea

Líneas de producto que maneja el proveedor (categorías/componentes que vende).

| Columna | Tipo | Nullable | Default | Descripción |
|---------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | PK |
| tenant_id | UUID | NO | | FK → tenant.id |
| proveedor_id | UUID | NO | | FK → proveedor.id |
| categoria_id | UUID | SI | | FK → categoria.id |
| componente_id | UUID | SI | | FK → componente.id |
| descripcion | VARCHAR(200) | SI | | |
| created_at | TIMESTAMPTZ | NO | now() | |

## Reglas de negocio

- Búsqueda por RUC
- Un proveedor puede tener múltiples contactos, métodos de pago y líneas
- `contacto_nombre` es el contacto principal directo; `proveedor_contacto` almacena contactos adicionales
- `tipo_cuenta` en métodos de pago agrupa: "banco" (CUENTA_CORRIENTE, CUENTA_AHORRO) o "monedero" (YAPE, PLIN)
- Calificación es manual (1-5 estrellas)
- Líneas vinculan al proveedor con categorías/componentes que vende (para clasificación SEGURO/POSIBLE en cotizaciones)
- `condicion_pago` es un catálogo por tenant; `es_default=true` se aplica automáticamente al crear proveedores sin condición explícita
