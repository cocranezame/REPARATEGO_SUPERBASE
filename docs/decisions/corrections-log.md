# Corrections Log — ReparaTego

> Cada corrección tiene ID, fecha, módulos afectados, y el cambio exacto.
> REGLA: antes de codear cualquier módulo, leer las correcciones que listen ese módulo en "afecta".

---

## C001 — 2026-05-26

**ID:** C001  
**Afecta:** infra, api  
**Contexto:** E0.3 scaffolding  

pnpm no estaba instalado en el entorno local (corepack de Node 20.18.1 falla con error de keyid signing). Se instaló con `npm install -g pnpm@9 --force`.

El `apps/api/src/index.ts` del scaffold no puede referenciar los tipos Web API `Request`/`Response` con la tsconfig Node (sin lib DOM). Se usa `unknown` como return type del stub hasta que E0.9 instale Hono con sus propios tipos.

**Corrección aplicada:** `apps/api/src/index.ts` — `createApp()` retorna `unknown` en lugar de `{ fetch: (req: Request) => Promise<Response> }`.

---

## C002 — 2026-05-26

**ID:** C002  
**Afecta:** infra  
**Contexto:** E0.4 — Biome + Husky + commitlint  

**Biome v2 breaking changes vs v1:**
1. `files.ignore` ya no existe en v2 — el campo correcto es `files.includes` (con negación). Se eliminó y se dejó que `vcs.useIgnoreFile: true` maneje los ignores via `.gitignore`.
2. `organizeImports.enabled` fue movido a `assist.actions.source.organizeImports: "on"` en v2.

**commitlint `subject-case`:** `@commitlint/config-conventional` bloquea sujetos que empiecen con mayúscula (sentence-case). El proyecto usa prefijos de ticket como `E0.3 —` y commits en español, por lo que se desactivó la regla: `"subject-case": [0]`.

**Corrección aplicada:** `biome.json` sin `files.ignore`; `.commitlintrc.json` con `subject-case: [0]`.

---

## C003 — 2026-05-26

**ID:** C003  
**Afecta:** infra  
**Contexto:** E0.5 — TypeScript estricto

**TS5110 — `module` debe coincidir con `moduleResolution` en Node16:**  
TypeScript 5.x emite error `TS5110` si `moduleResolution: "Node16"` se combina con `module: "CommonJS"`. Deben ser iguales. Se cambió `module: "CommonJS"` → `module: "Node16"` tanto en `tsconfig.base.json` como en los overrides de cada paquete.

Con `module: "Node16"` y sin `"type": "module"` en los `package.json`, el output sigue siendo CJS (Node16 interpreta `.js` como CJS por defecto). No hay cambio de comportamiento en runtime.

**Corrección aplicada:** `tsconfig.base.json` y todos los tsconfig de paquetes usan `"module": "Node16"` + `"moduleResolution": "Node16"`.

---

## C004 — 2026-05-27

**ID:** C004  
**Afecta:** web  
**Contexto:** E0.10 — Scaffold Web

**Vite 8 requiere Node.js 20.19+ (entorno tiene 20.18.1):**  
pnpm instaló `vite@^8` (latest) que usa Rolldown (bundler Rust), el cual requiere Node.js 20.19+. El entorno corre Node.js 20.18.1 — el servidor de Vite falla al intentar cargar el binding nativo de Rolldown.

**Corrección aplicada:** Downgrade a `vite@^5.4` + `@vitejs/plugin-react@^4`, que soportan Node.js 18+. Vite 5 no usa Rolldown (usa esbuild + rollup), funciona correctamente con Node.js 20.18.1.

**Nota:** Al instalar versiones de paquetes sin pin, usar `"vite": "^5.4"` explícitamente para este proyecto hasta actualizar Node.js a 20.19+.

**`exactOptionalPropertyTypes: true` con Fetch API:**  
Pasar `body: undefined` a `RequestInit` viola `exactOptionalPropertyTypes` porque `RequestInit.body` tiene tipo `BodyInit | null` (sin `undefined`). Se corrigió con spread condicional: `...(body !== undefined && { body: JSON.stringify(body) })`.

**`noUnknownAtRules` de Biome con Tailwind CSS:**  
Las directivas `@tailwind base/components/utilities` son desconocidas para el linter CSS de Biome. Corregido añadiendo `"noUnknownAtRules": "off"` en `biome.json` bajo `linter.rules.suspicious`.

---

## C005 — 2026-05-27

**ID:** C005  
**Afecta:** db  
**Contexto:** E0.12 — Docker Compose

**TS2580 — `process` no encontrado en `packages/db`:**  
Al agregar `createDbClientFromEnv()` a `packages/db/src/client.ts` usando `process.env.DATABASE_URL`, TypeScript emitió `TS2580: Cannot find name 'process'`. El package no tenía `@types/node` como devDependency (el `drizzle.config.ts` ya usaba `process.env` pero es ejecutado por drizzle-kit con su propio runner, no por tsc).

**Corrección aplicada:** `@types/node` instalado como devDependency en `packages/db`.

---

## C006 — 2026-05-27

**ID:** C006  
**Afecta:** infra, db  
**Contexto:** E0.13 — Smoke test local

**Puerto 5432 ocupado por otras instancias Postgres locales:**  
El entorno de desarrollo ya tiene instancias Postgres en los puertos 5432, 5433 y 5434 (otros proyectos). `drizzle-kit migrate` conectaba silenciosamente a la instancia equivocada y fallaba con exit code 1 sin mostrar el error real ("no existe la base de datos reparatego_dev" en la instancia externa). La API tampoco podía conectar.

**Corrección aplicada:** Docker Compose usa el puerto `5435` (host) → `5432` (container). `DATABASE_URL` en `.env.example` y `env-vars.md` actualizado a `localhost:5435`.

**Nota:** Para futuros entornos con conflicto de puertos, cambiar el puerto host en `docker-compose.yml` a cualquier puerto libre ≥ 5435.

---

## C007 — 2026-05-27

**ID:** C007  
**Afecta:** db  
**Contexto:** E1.2 — RLS policies

**`RESET app.tenant_id` produce string vacío, no NULL:**  
`current_setting('app.tenant_id', true)` con `missing_ok = true` devuelve NULL cuando la variable nunca fue seteada. Pero `RESET app.tenant_id` deja la variable como `""` (string vacío), no como NULL. Intentar `""::uuid` falla con `invalid input syntax for type uuid`.

**Corrección aplicada:** Policies usan `NULLIF(current_setting('app.tenant_id', true), '')::uuid`. `NULLIF('', '')` → NULL → `NULL::uuid` = NULL → la policy no pasa filas (seguro por defecto).

**Nota:** En la práctica, la API usa `SET LOCAL` dentro de transacciones (no `RESET`), así que este caso solo ocurre en testing manual con psql.

---

## C008 — 2026-05-27

**ID:** C008  
**Afecta:** api  
**Contexto:** E1.3 — CRUD usuario

**Hono `c.req.valid()` devuelve `never` con handlers separados de rutas:**  
Cuando los handlers se definen en un archivo separado y reciben `Context<{ Variables: HonoVariables }>`, el tipo genérico `Input` queda como `{}` vacío. `c.req.valid("query")` infiere `T extends keyof I & keyof ValidationTargets` — como `I = {}`, el resultado es `never`. Intentar tipar `HonoInput = { in: { json: ...; query: ... } }` tampoco resuelve porque `Context` no lo propaga correctamente a `HonoRequest`.

**Corrección aplicada:** `type HonoCtx = Context<{ Variables: HonoVariables }, string, any>` con `// biome-ignore lint/suspicious/noExplicitAny`. El `any` en el tercer genérico (`Input`) desbloquea `valid()` sin afectar type-safety del dominio.

**Drizzle `PgTransaction` type deeply generic — `tx.execute()` sin tipo explícito:**  
`db.transaction(async (tx) => { ... })` — el tipo de `tx` es `PgTransaction<...>` con parámetros de tipo muy genéricos. Intentar tipar el parámetro de la función `setTenantLocal(tx: PgTransaction<...>)` requiere instanciar todos los type params. Solución estructural: `interface TxLike { execute(query: SQL<unknown>): Promise<unknown> }` — pero `tx` aún debe tipificarse como `any` al llamar con `biome-ignore`.

**Corrección aplicada:** `async function setTenantLocal(tx: any, ...)` con `// biome-ignore lint/suspicious/noExplicitAny`.

---

## C009 — 2026-05-27

**ID:** C009  
**Afecta:** api  
**Contexto:** E1.6 — Auth JWT

**`jose` v5+ es ESM-only — incompatible con monorepo CJS:**  
`jose` v5+ no tiene entrypoint CommonJS. En un monorepo donde `@kallpasoft/db` es CJS y `apps/api` también lo es (sin `"type": "module"`), un static `import { SignJWT } from "jose"` dispara TS1479. Intentar `"type": "module"` en `apps/api` causó TS2345 de dual-resolution en `drizzle-orm`: `apps/api` (ESM) y `@kallpasoft/db` (CJS) resuelven `drizzle-orm` desde entrypoints distintos, generando dos declaraciones incompatibles de la clase `SQL` (`private shouldInlineParams`).

**Corrección aplicada:** Reemplazar `jose` por `jsonwebtoken@9` (CJS-compatible, sin dependencias nativas). API idéntica a nivel de tokens generados (HS256 / HS384 / RS256). `JWT_SECRET` permanece como variable de entorno.

**Nota:** Para migrar a `jose` en el futuro, hacer todos los packages del monorepo ESM simultáneamente (agregar `"type": "module"` a todos los package.json y reconstruir).

---

## C010 — 2026-05-28

**ID:** C010  
**Afecta:** web  
**Contexto:** E1.11 — Web: CRUD sucursales

**`z.boolean().default(false)` produce tipo de entrada `boolean | undefined` — incompatible con `exactOptionalPropertyTypes`:**  
`createSucursalSchema` tiene `es_principal: z.boolean().default(false)`. `z.infer<>` de un campo con `.default()` produce `boolean | undefined` para el tipo de entrada. Cuando se usa en `useForm<SucursalFormValues>({ resolver: zodResolver(schema) })`, el `Resolver<TFieldValues>` necesita que `TFieldValues` y el tipo inferido coincidan exactamente. Con `exactOptionalPropertyTypes: true`, `boolean` no es asignable a `boolean | undefined`, causando TS2322.

**Corrección aplicada:** Al extender el schema para el formulario, sobreescribir el campo con `es_principal: z.boolean()` (sin `.default()`). El valor por defecto se provee en `useForm defaultValues: { es_principal: false }`, no en el schema.

**Regla:** Nunca usar `.default()` en campos de un schema de formulario React Hook Form. Proveer el valor default en `defaultValues` del `useForm`.

---

## C011 — 2026-05-30

**ID:** C011  
**Afecta:** api, web  
**Contexto:** E7 — Solicitudes + OC

**`exactOptionalPropertyTypes` con campos opcionales de Zod en tipos de dominio:**  
`z.string().optional()` en Zod infiere `string | undefined`. Con `exactOptionalPropertyTypes: true`, un tipo de dominio que declara `notas?: string` (exactamente `string` si presente) no acepta `string | undefined`. Igual para `?: number` en ports de repositorio.

**Corrección aplicada:** Tipos de domain ports usan `?: T | undefined` explícito para campos opcionales que reciben valores de Zod-inferred types:
- `ConfirmarOrdenItemData.notas?: string | undefined`
- `UpdateSolicitudData.cantidad_solicitada?: number | undefined`, etc.

**Regla:** Cuando un port type recibe datos de Zod-inferred schemas con `exactOptionalPropertyTypes`, declarar los opcionales como `?: T | undefined`, no `?: T`.

**`exactOptionalPropertyTypes` con props opcionales en JSX (React):**  
Pasar `prop={variableQueEsUndefined}` donde la prop es `?: string` viola la restricción. Con `undefined` explícito en la variable, TypeScript rechaza la asignación.

**Corrección aplicada:** Spread condicional en JSX: `{...(variable !== undefined ? { prop: variable } : {})}` — mismo patrón de C004.

**Regla consolidada para tipos de dominio (E8):**  
Todo campo opcional en tipos de dominio (entities, ports) que recibe valores de joins Drizzle (que pueden ser `null | undefined`) debe declararse como `?: T | undefined` explícito, no `?: T`. Aplica especialmente cuando el campo proviene de un `leftJoin` + `.map()` que transforma `null` a `undefined`.

---

## C012 — 2026-05-30

**ID:** C012  
**Afecta:** api  
**Contexto:** E8 — Lotes y Movimientos

**`exactOptionalPropertyTypes` en tipos de entidades con campos de joins (stock.ts):**  
`StockItem.sucursal_nombre` declarado como `sucursal_nombre?: string` no acepta `string | undefined` proveniente de un `.map()` de leftJoin. TypeScript TS2322 — Type `string | undefined` is not assignable to type `string`.

**Corrección aplicada:** `sucursal_nombre?: string | undefined` en `StockItem`. Regla: todos los campos opcionales en entidades de dominio que reciben valores de leftJoins deben declararse `?: T | undefined`.

**Nota:** Igual aplica a `Lote.producto_nombre`, `Lote.sucursal_nombre`, `MovimientoInventario.producto_nombre`. Solucionado con `.map()` explícito en el repositorio que asigna `?? undefined`.

---

## C013 — 2026-05-30

**ID:** C013  
**Afecta:** web  
**Contexto:** E10 — Servicios

**`exactOptionalPropertyTypes` con hook params que usan `|| undefined`:**  
En `NuevaOrdenPage`, `useClientes({ search: searchCliente || undefined, pageSize: 50 })` — cuando `searchCliente` es vacío, `search` recibe `undefined`. Con `exactOptionalPropertyTypes: true`, el parámetro `search?: string` en `ClientesParams` no acepta `undefined` como valor asignado (sólo puede estar ausente).

**Corrección aplicada:** Spread condicional en lugar de `|| undefined`:
```ts
useClientes({ ...(searchCliente ? { search: searchCliente } : {}), pageSize: 50 })
```

**Regla consolidada (C004, C011, C013):** En web, cuando se pasa un campo opcional a un hook/componente, siempre usar spread condicional si el valor puede ser `undefined`. Nunca usar `prop={variable || undefined}` ni `{ campo: variable || undefined }`.

---

## C014 — 2026-05-30

**ID:** C014  
**Afecta:** api  
**Contexto:** E11 — Ventas

**TS5076 — `??` y `||` no se pueden mezclar sin paréntesis:**  
TypeScript 5.x emite `TS5076` cuando se escribe `a ?? b || c` sin paréntesis. El compilador no puede inferir la precedencia de `??` vs `||` sin agrupación explícita.

Ejemplo incorrecto:
```ts
cliente_nombre: r.cliente_razon_social ??
  `${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined,
```

**Corrección aplicada:** Envolver la sub-expresión con `||` entre paréntesis:
```ts
cliente_nombre: r.cliente_razon_social ??
  (`${r.cliente_nombres ?? ""} ${r.cliente_apellidos ?? ""}`.trim() || undefined),
```

**Regla:** Cuando se combina `??` con `||` en la misma expresión, siempre usar paréntesis explícitos alrededor de la sub-expresión con `||`.

---

## C015 — 2026-05-31

**ID:** C015
**Afecta:** api, infra
**Contexto:** Seed local + verificación de dev

**Problema 1 — `tsx watch` no carga variables de entorno antes de módulos CJS:**
La API no tiene dotenv en su `server.ts`. Cuando `tsx watch src/server.ts` arranca, las rutas (auth, etc.) inicializan su repositorio `const repo = new AuthDrizzleRepository(getDb())` a nivel de módulo. `getDb()` llama a `createDbClientFromEnv()` que lee `process.env.DATABASE_URL` — pero dotenv aún no cargó el `.env`. Intentar `import { config } from "dotenv"; config(...)` en server.ts no funciona porque tsx transpila static imports a `require()` calls, y todos los requires se hoistan antes de que `config()` se ejecute.

`tsx --env-file=../../.env watch src/server.ts` también falla: tsx no reconoce `watch` como subcomando cuando hay flags antes de él.

**Corrección aplicada:** Bootstrap file `apps/api/bootstrap.cjs` (CJS puro):
```js
require("dotenv").config({ path: "../../.env" });  // carga env ANTES que cualquier módulo TS
require("tsx/cjs");                                  // registra el hook TypeScript de tsx
require("./src/server.ts");                          // arranca la API
```

Dev script cambiado a `node --watch bootstrap.cjs` (Node.js 20+ built-in watch mode).

**Problema 2 — `tsx --env-file` delante de `watch` rompe el parsing de subcomandos:**
tsx@4.22.3: si se pone cualquier flag antes de `watch`, el parser de tsx no lo reconoce como subcomando y lo trata como el script a ejecutar → `ERR_MODULE_NOT_FOUND: Cannot find module '.../watch'`.

**Regla:** Para la API, siempre usar `bootstrap.cjs` como entry point. No intentar hacer que tsx watch cargue el env file vía flags.

**Problema 3 — `pnpm build` (producción) falla con Rollup + CJS re-exports de validators:**
Rollup no puede hacer static analysis de `__exportStar(require("./seguridad.js"), exports)` en el build de producción de la Web. Error: `"loginSchema" is not exported by ...dist/index.js`. En `pnpm dev` (Vite dev server con esbuild) no ocurre.

**Nota:** Pendiente de fix para deploy (E0D). En desarrollo, usar `pnpm dev` — no `pnpm build`.

**Nota adicional — Login endpoint:**
El endpoint `/api/v1/auth/login` requiere 3 campos: `tipo_documento`, `numero_documento`, `password`. Y el header `X-Tenant-Id` para el contexto RLS.

---

## [C002] 2026-05-31 — Refactorizar módulo de servicios completo
- **Afecta:** servicios, ventas, domicilios, crm, compras, clientes, catálogos, inventario
- **Antes:**
  - orden_servicio se vinculaba directo a cliente_id + categoria_id + marca_id + modelo_id
  - 9 estados: RECEPCION, REVISION, PRESUPUESTO, COTIZADO, APROBADO, EN_REPARACION, AVISADO, ENTREGADO, DEVOLUCION
  - No existía concepto de INSTANCIA (equipo físico del cliente)
  - No existían tablas: instancia, periferico, costo_revision, orden_servicio_periferico, orden_servicio_sku_asignado, orden_servicio_requerimiento, orden_servicio_aceptacion, orden_servicio_historial, orden_servicio_observacion
  - No existía portal del cliente
  - E10 tenía 10 tickets
- **Ahora:**
  - Se introduce INSTANCIA como entidad intermedia: cliente → instancia → orden_servicio. El cliente se obtiene siempre vía instancia, nunca directo desde servicio
  - 12 estados: VALIDACION, REVISION, DIAG_PRELIMINAR, DIAG_FINAL, COTIZADO, APROBADO, AGREGAR_SKU, PRIORIDAD, REPARADO, AVISADO, ENTREGADO, GARANTIA + DEVOLUCION lateral desde DIAG_FINAL
  - Se agregan 9 tablas nuevas al módulo de servicios
  - Se agrega portal del cliente (reparatego.com/mis-equipos) con auth DNI + celular
  - E10 crece a 28 tickets organizados en 6 sub-épicas
  - Retrocesos definidos: DIAG_FINAL→DIAG_PRELIMINAR, COTIZADO→DIAG_FINAL, APROBADO→COTIZADO, AGREGAR_SKU→APROBADO, PRIORIDAD→AGREGAR_SKU, AVISADO→REPARADO
  - Venta se genera AUTOMÁTICAMENTE al pasar de AGREGAR_SKU a REPARADO o PRIORIDAD
  - Aceptaciones del cliente guardan trazabilidad legal (IP, timestamp, versión T&C, texto_mostrado) para respaldo INDECOPI
  - Canal TIENDA/DOMICILIO define color de tarjeta en kanban (verde/amarillo)
- **Razón:** se recibió el informe funcional y técnico v2.0 del módulo de servicios completo que redefine el flujo, introduce instancias, portal del cliente, y amplía significativamente los estados y tablas
- **Migración:** pendiente (se ejecutará en E10)
- **Pendientes resueltos:**
  - P1: Vendedora SÍ puede reclasificar preventivo/correctivo antes de registrar cotización. Inmutable después
  - P2: Si técnico modifica componentes en DIAG_FINAL tras retroceso desde COTIZADO, la cotización anterior se invalida y debe armarse nueva
  - P3: Búsqueda con paginación (50 items por página)
  - P4: Item MANUAL se clasifica manualmente como preventivo/correctivo por la vendedora
  - P5: Sin log de auditoría para tipo_accion por ahora, basta con registro final
- **Impacto en schema:** de 47 tablas pasa a ~55 tablas (se agregan 9 tablas nuevas, se agrega tabla periferico a catálogos)
- **Impacto en roadmap:** E10 se reorganiza de 10 tickets a 28 tickets en 6 sub-épicas

---

## [C003] 2026-06-01 — Refactorizar módulo de ventas con POS, adelantos y flujo servicios
- **Afecta:** ventas, servicios, inventario, domicilios, clientes
- **Antes:**
  - Venta se generaba solo al pasar de AGREGAR_SKU → REPARADO/PRIORIDAD
  - No existía POS como interfaz principal
  - No se distinguía regla de pago entre venta libre y asociada
  - Escaneo de SKU no era obligatorio
  - Caja no bloqueaba acceso al módulo completo
  - Un solo campo estado_pago
  - Tasa de precio 1:1 con producto
- **Ahora:**
  - Venta asociada a servicio se puede generar desde COTIZADO/APROBADO para recibir adelantos parciales. En AGREGAR_SKU se precargan SKUs en la venta ya existente. En AVISADO "Cobrar" abre el POS con la venta existente. En DEVOLUCIÓN genera venta de revisión automáticamente
  - POS como interfaz principal: panel catálogo (escaneo SKU + filtros + grilla) + panel carrito + modal pagos
  - Venta LIBRE = pago completo obligatorio, sin excepciones. Venta SERVICIO = admite pagos parciales (adelantos) desde COTIZADO
  - Escaneo de SKU obligatorio para productos. Un SKU = una unidad física. Múltiples unidades = múltiples escaneos
  - Sin caja abierta el módulo completo es inaccesible. Solo una caja abierta por usuario
  - Dos ejes independientes de estado: pago (PAGO_PENDIENTE → COMPLETADA | ANULADA) y despacho (SIN_ENVIO | ENVIO_PENDIENTE → DESPACHADO)
  - Jerarquía de tasas de precio: POR_REPUESTO > POR_TIPO > POR_COMPONENTE
- **Razón:** se recibió el informe funcional del módulo de ventas que redefine el flujo de cobro integrado con servicios, introduce POS y reglas diferenciadas de pago
- **Migración:** pendiente (se ejecutará en E11)
- **Pendientes resueltos:**
  - P1: Cotización indefinida, sin vigencia
  - P2: Se puede anular venta con pagos parciales, requiere validación de ADMINISTRADOR o ASISTENTE. Montos pagados quedan como saldo a favor (nota de crédito, preparación SUNAT)
  - P3: Voucher NO incluye QR/código de barras. Los códigos de barras son exclusivos de productos inventariados (SKUs) y sirven para escaneo en el POS
  - P4: Vendedor ve solo sus ventas, Administrador ve todas
  - P5: Reporte de cierre de caja imprimible
  - P6: Descuentos/promociones diferido a post-producción
- **Impacto en servicios (C002):** el flujo de generación de venta cambia — ya no se genera solo en AGREGAR_SKU→REPARADO/PRIORIDAD, sino que puede generarse desde COTIZADO/APROBADO para adelantos. El botón "Cobrar" en AVISADO abre el POS con la venta existente, no crea una nueva
- **Impacto en schema:** se necesita campo rol ASISTENTE en tabla usuario. Tabla tasa_precio requiere refactorización para soportar jerarquía. Se agrega campo nota_credito/saldo_favor para anulaciones con pagos parciales

---

## C019 — 2026-06-01

**ID:** C019
**Afecta:** db, api
**Contexto:** E4 — Inventario C004

**Rol ALMACEN pendiente de migración DB:**
I24-I26 definen permisos diferenciados para el rol ALMACEN. El enum `rol_usuario` en PostgreSQL actualmente no incluye el valor `ALMACEN`. Se agregó `ALMACEN: "ALMACEN"` al enum TypeScript `RolUsuario` en `packages/shared/src/enums.ts` para que el sistema de autorización lo reconozca cuando exista en la DB. Actualmente ningún usuario puede tener `rol = "ALMACEN"` porque la inserción fallaría en PostgreSQL.

Las rutas de inventario ya usan `authorize("ADMIN", "ALMACEN")` y `authorize("ADMIN", "ALMACEN", "VENDEDOR")` preparadas para este rol.

**Migración DB necesaria:**
```sql
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'ALMACEN';
```

**Regla:** Una vez ejecutada la migración, el rol ALMACEN funcionará automáticamente con los permisos definidos en las rutas de inventario.

---

## C016 — 2026-06-01

**ID:** C016
**Afecta:** db, infra
**Contexto:** E11.1 — Migraciones ventas C003

**Divergencia entre archivos de migración manual y journal de drizzle-kit:**
Los archivos `0015_rls_ventas.sql`, `0016_rls_domicilios.sql` y `0016_e10_servicios_c002.sql` existen en `packages/db/drizzle/` pero NO están registrados en `meta/_journal.json`. El journal termina en `idx: 15 / tag: 0015_rainy_kitty_pryde`. Estos archivos fueron escritos y aplicados manualmente (fuera del flujo drizzle-kit).

Consecuencia: si se ejecuta `drizzle-kit generate` en el estado actual, comparará el Drizzle TypeScript schema contra el snapshot `0015_snapshot.json` (que solo incluye domicilios) e intentará regenerar todo el módulo de servicios y las RLS de ventas como si no existieran en la DB.

**Corrección aplicada:** A partir de E11, usar exclusivamente migraciones manuales numeradas (`0017_*`, `0018_*`, …). No ejecutar `drizzle-kit generate` ni `drizzle-kit migrate` — solo `drizzle-kit studio` para inspección visual si se necesita. Las migraciones se aplican con psql directo al contenedor local (`psql -h localhost -p 5435 -U postgres -d reparatego_dev -f <archivo>.sql`).

**Regla:** Para este proyecto, drizzle-kit solo se usa como fuente de snapshots de tipo para TypeScript (type inference). Las migraciones de producción son SQL manual versionado.

---

## C017 — 2026-06-01

**ID:** C017
**Afecta:** api (modules/cajas, modules/ventas, modules/cotizaciones-venta)
**Contexto:** E11.2 — Implementación endpoints ventas C003

**Módulos API en estado pre-C003 (schema obsoleto):**
Los tres módulos de ventas en `apps/api/src/modules/` fueron implementados antes de la migración C003 y usan campos que ya no existen en el schema:

- `modules/cajas`: usa `monto_apertura` (→ `monto_inicial`), `monto_cierre`+`notas_cierre` (→ `monto_fisico`+`diferencia`). Rutas en `/cajas/*` en vez de `/ventas/caja/*`.
- `modules/ventas`: usa `activo`, `estado` (viejo), `usuario_id` (→ `created_by`), `notas`, `subtotal`, `igv`, `descuento`, `tipo_comprobante`. Validators importan tipos que ya no existen (`createVentaEnvioSchema`, `updateEnvioEstadoSchema`). No implementa lógica C003 (SKU obligatorio, stock por lote, tipo_item, pagos parciales vs completos, dos ejes de estado, anulación con nota de crédito).
- `modules/cotizaciones-venta`: usa `activo`, `estado`, `usuario_id` (→ `created_by`), `subtotal`, `igv`, `fecha_vencimiento`, `notas`. No usa `total_referencial` ni `caja_id`.

**Corrección aplicada:** Reescritura completa de los tres módulos en E11.2, siguiendo el mismo patrón DDD del resto de la API. Rutas actualizadas a `/ventas/caja/*`, `/ventas/*`, `/ventas/cotizaciones/*`.

**Regla:** Al implementar módulos API, verificar siempre que los nombres de campos de la entidad de dominio coincidan con el schema Drizzle actual, no con el pre-migración.

---

## C018 — 2026-06-01

**ID:** C018
**Afecta:** api, db
**Contexto:** E11.2 — Anulación de ventas (V28)

**Rol ASISTENTE pendiente de migración DB:**
V28 establece que la anulación de ventas requiere rol ADMINISTRADOR o ASISTENTE. El enum `rol_usuario` en PostgreSQL actualmente tiene valores: ADMIN, TECNICO, VENDEDOR, CAJERO. No existe el valor ASISTENTE en la DB.

Se agregó `ASISTENTE: "ASISTENTE"` al enum TypeScript `RolUsuario` en `packages/shared/src/enums.ts` para que el sistema de autorización lo reconozca cuando llegue a existir en la DB. Sin embargo, actualmente ningún usuario puede tener `rol = "ASISTENTE"` porque la inserción fallaría en PostgreSQL.

El endpoint `PATCH /ventas/:id/anular` actualmente solo permite ADMIN hasta que la DB sea migrada.

**Corrección aplicada:** TypeScript: `ASISTENTE` agregado a `RolUsuario`. DB: pendiente.

**Migración DB necesaria:**
```sql
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'ASISTENTE';
```

**Regla:** Una vez ejecutada la migración, actualizar `PATCH /ventas/:id/anular` en `apps/api/src/modules/ventas/http/routes.ts` para incluir `authorize("ADMIN", "ASISTENTE")`.

---

## [C004] 2026-06-01 — Adaptar módulo inventario con lógica de lotes dual, jerarquía de tasas y clasificación de proveedores
- **Afecta:** inventario, compras, ventas, servicios
- **Antes:**
  - Cada ingreso de inventario creaba un lote nuevo siempre
  - Tasa de precio 1:1 con producto, sin jerarquía
  - Proveedores en cotización se listaban sin clasificación
  - No existía generación de mensaje WhatsApp para proveedores en cotización
  - No existía dashboard de inventario
  - No existía campo stock_minimo en producto
  - No existía lógica FIFO para consumo de lotes
  - Merma y reajuste sin control de permisos específico
- **Ahora:**
  - Lógica dual de lotes:
    - Ingreso manual: mismo producto + mismo día + mismo proveedor = editar lote existente sumando cantidad. Diferente proveedor mismo día = nuevo lote con correlativo al final del SKU
    - Ingreso por OC (automático): SIEMPRE crea lote nuevo, nunca edita existente. Todo en transacción atómica con rollback
  - Jerarquía de tasas de precio: POR_REPUESTO > POR_TIPO > POR_COMPONENTE. Se toma la más específica disponible. Requiere refactorizar tabla tasa_precio para soportar los 3 niveles
  - Proveedores en cotización se clasifican automáticamente: SEGURO (verde, coinciden categoría + componente) y POSIBLE (solo categoría)
  - Generación de URL WhatsApp (wa.me/{numero}?text={mensaje}) con mensaje predefinido para contactar proveedores desde cotización
  - Dashboard de inventario con indicadores: total productos, stock bajo mínimo, cotizaciones pendientes
  - Campo stock_minimo INTEGER DEFAULT 0 en tabla producto para alertas de reabastecimiento
  - Consumo de lotes: FIFO por defecto. En venta libre FIFO automático, en servicio el técnico escanea SKU específico
  - Merma y reajuste requieren rol ADMINISTRADOR o ALMACEN
  - SKU de lote: código producto + DDMMAA sin separador. Correlativo numérico al final si hay más de un proveedor del mismo producto en el mismo día
  - Múltiples ingresos permitidos desde la misma cotización con diferentes proveedores (no hay proveedor ganador)
  - Último costo se obtiene de la cotización usada en el último movimiento de ingreso
  - Precio de venta se recalcula automáticamente al cambiar tasa o al registrar nuevo ingreso
- **Razón:** se recibió el informe funcional del módulo inventario que amplía la lógica de lotes, introduce jerarquía de tasas, clasificación de proveedores y alertas de stock mínimo
- **Migración:** pendiente (actualización en módulos E4-E9)
- **Pendientes resueltos:**
  - P1: Descripción de servicio opcional
  - P2: Stock mínimo por producto, campo stock_minimo INTEGER DEFAULT 0
  - P3: Reporte comparación costos históricos diferido a E14 (dashboard/reportes)
  - P4: FIFO por defecto para consumo de lotes. Venta libre = FIFO automático, servicio = técnico escanea SKU específico
  - P5: Merma y reajuste requieren ADMINISTRADOR o ALMACEN
  - P6: Permisos: ADMINISTRADOR todo, ALMACEN stock/lotes/movimientos, VENDEDOR solo lectura stock/precios
  - P7: Catálogos ya resuelto en E2 como módulo independiente
- **Impacto en schema:**
  - Agregar campo stock_minimo en tabla producto
  - Refactorizar tasa_precio para soportar jerarquía de 3 niveles (producto, tipo, componente)
  - Agregar campo correlativo en tabla lote para SKUs del mismo día con diferente proveedor
  - Agregar endpoint de mensaje WhatsApp en cotización
  - Agregar dashboard de inventario

---

## [C005] 2026-06-02 — Implementar módulo CRM completo con agente IA Nico, pipeline configurable y WhatsApp
- **Afecta:** crm, clientes, servicios, inventario, seguridad
- **Antes:**
  - Schema CRM tenía 15 tablas definidas pero sin datos iniciales de etapas ni etiquetas
  - No existían tools de Nico, context builder, webhook HMAC, bots determinísticos
  - Campos UTM documentados en C001 pero no implementados
  - No existían endpoints de métricas CRM documentados en C001
- **Ahora:**
  - Pipeline de 15 etapas configurables desde panel admin (nombre, operador, objetivo editables)
  - Operador por etapa: IA (Nico responde), HUMANO (vendedor responde), BOT (flujo determinístico configurable), SISTEMA (etapa final automática)
  - 19 etiquetas en 4 grupos como seed data inicial, editables desde admin
  - 8 tools de Nico: guardarDato, moverEtapa, buscarCliente, crearCliente, crearServicio, derivarVendedor, enviarLink, consultarRepuesto
  - Tools operan directo sobre schemas existentes vía SQL, NO vía endpoints HTTP internos
  - Context builder: comprime etiquetas + últimos N mensajes + datos del lead para Haiku
  - Webhook Meta con validación HMAC timing-safe + idempotencia por wa_message_id
  - 3 bots determinísticos: cotización repuesto, servicio en proceso, recordatorio (config JSONB)
  - Modo conversación NICO/VENDEDOR con pausa automática de Nico al derivar y devolución explícita
  - Campos UTM (C001): utm_source, utm_campaign, utm_medium en crm_lead
  - Endpoints métricas (C001): /crm/health, /crm/leads, /crm/clients/metrics, /crm/sales, /crm/audiences
  - Mensajería interna separada de WhatsApp
  - Portal CRM dentro de apps/web, no app separada
- **Razón:** se recibió informe funcional completo del módulo CRM + Agente IA
- **Migración:** se ejecutará en E13.1
- **Pendientes resueltos:**
  - P1: 15 etapas definidas como seed data configurable (PRIMER_CONTACTO, IDENTIFICACION, CAPTURA_EQUIPO, CAPTURA_FALLA, CAPTURA_UBICACION, COTIZACION_INFORMAL, DECISION_CLIENTE, REGISTRO_CLIENTE, REGISTRO_SERVICIO, DERIVACION_VENDEDOR, SEGUIMIENTO_SERVICIO, COTIZACION_REPUESTO, ESPERANDO_RESPUESTA, CONVERTIDO, SIN_RESPUESTA)
  - P2: 19 etiquetas en 4 grupos como seed data configurable
  - P3: Prompt base de Nico diferido a implementación. Se crea docs/crm/nico-prompt.md para iterar
  - P4: Pasos de bots diferidos. Config JSONB permite iterar sin migración
  - P5: Plantillas HSM diferidas hasta cuenta Meta aprobada
  - P6: Asignación vendedor: round-robin por sucursal como default, configurable después
  - P7: Tiempo espera recordatorio: 24h por defecto en todas las etapas, configurable por etapa
  - P8: Nico requiere confirmación del CLIENTE para crear servicio ("¿Confirmo tu reparación?")
  - P9: Tech Provider Meta diferido. Token manual hasta aprobación
  - P10: Nico solo texto y links por ahora, no imágenes
  - P11: Nico responde 24/7. Si necesita humano fuera de horario, deja nota y avisa horario laboral
  - P12: No hay conversaciones previas a migrar, sistema nuevo
- **Seed data inicial:**
  - 15 etapas del pipeline con operador y objetivo
  - Transiciones dirigidas entre etapas
  - 19 etiquetas en 4 grupos
  - 1 agente (Nico, canal WHATSAPP, modelo claude-haiku)
  - 3 bots (cotización repuesto, servicio proceso, recordatorio)
  - Métodos de pago catálogo si no existen
