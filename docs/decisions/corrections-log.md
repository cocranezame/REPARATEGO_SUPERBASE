# Corrections Log — ReparaTego

> Cada corrección tiene ID, fecha, módulos afectados, y el cambio exacto.
> REGLA: antes de codear cualquier módulo, leer las correcciones que listen ese módulo en "afecta".

---

## C033 — 2026-06-09

**ID:** C033
**Afecta:** db, validators, api/clientes, web/servicios/NuevaOrdenPage
**Contexto:** Campos `distrito` y `nivel` en cliente para segmentación geográfica y prioridad

- **Migración 0032** `packages/db/drizzle/0032_cliente_distrito_nivel.sql`: `ADD COLUMN distrito VARCHAR(100)`, `ADD COLUMN nivel VARCHAR(10) NOT NULL DEFAULT 'NORMAL'`
- **schema** `packages/db/src/schema/clientes.ts`: `distrito varchar(100)`, `nivel varchar(10).notNull().default("NORMAL")`
- **validators** `packages/validators/src/clientes.ts`: `nivelClienteSchema = z.enum(["ALTO","NORMAL","BAJO"])`, `clienteBaseSchema` extiende con `distrito?` y `nivel` (default "NORMAL"); `updateClienteSchema` agrega ambos opcionales
- **entity** `apps/api/src/modules/clientes/domain/entities/cliente.ts`: `distrito: string | null`, `nivel: string`
- **ports** `apps/api/src/modules/clientes/domain/ports/cliente.repository.ts`: `distrito?` y `nivel?` en Create; `distrito?: string | null` y `nivel?` en Update
- **use-cases** `create-cliente.ts` + `update-cliente.ts`: pass-through de `distrito` y `nivel`
- **repo drizzle** `cliente.drizzle.ts`: insert y update incluyen `distrito` y `nivel`
- **web types** `clientes/types/cliente.ts`: `distrito: string | null`, `nivel: "ALTO" | "NORMAL" | "BAJO"`
- **web form** `NuevaOrdenPage.tsx`: selector distrito (agrupado Lima Norte/Centro/Sur, default Comas) + selector nivel (default Normal), ambos requeridos en formulario inline nuevo cliente

---

## C032 — 2026-06-08

**ID:** C032
**Afecta:** db, validators, api/inventario, api/servicios, web/inventario
**Contexto:** Rediseño formulario Nuevo Repuesto — subtipo + alcance condicional + multi-categoría UI

- **Migración 0027** `packages/db/drizzle/0027_producto_subtipo_cat_nullable.sql`: `ADD COLUMN subtipo VARCHAR(50)` + `ALTER COLUMN categoria_id DROP NOT NULL`
- **schema** `packages/db/src/schema/inventario.ts`: `categoria_id` sin `.notNull()`, nuevo `subtipo varchar(50)`
- **validators** `packages/validators/src/inventario.ts`: `categoria_id` → `uuidSchema.optional()`, `subtipo: z.string().max(50).optional()`
- **entity** `apps/api/src/modules/inventario/domain/entities/producto.ts`: `categoria_id: string | null`, `subtipo: string | null`
- **ports** `apps/api/src/modules/inventario/domain/ports/producto.repository.ts`: `categoria_id?` en Create, `categoria_id?: string | null` en Update, `subtipo?` en ambos
- **use-cases** create-producto.ts + update-producto.ts: pass-through de `subtipo`
- **repo drizzle** producto.drizzle.ts: `categoria_id: data.categoria_id ?? null`, `subtipo: data.subtipo ?? null`
- **downstream fix** stock.drizzle.ts L969/L1000: `eq(proveedorLinea.categoria_id, prod.categoria_id)` → conditional `prod.categoria_id ? eq(...) : sql\`true\``
- **downstream fix** servicios/domain/entities/servicio.ts: `Instancia.categoria_id?: string | null | undefined`, `PresupuestoItem.categoria_id: string | null`
- **web types** inventario.ts: `ProductoDto.categoria_id: string | null`, `subtipo: string | null`
- **web form** ProductoFormPage.tsx: rediseño completo — secciones por alcance (GLOBAL/CATEGORIA/MARCA/COMPATIBILIDAD), multi-row categorías (UI), botón Generar nombre, modelos inline con doble-click, sin unidad_medida

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

---

## [C006] 2026-06-02 — Agregar WHATSAPP al enum canal_servicio
- **Afecta:** servicios, crm
- **Antes:** canal_servicio solo tenía TIENDA y DOMICILIO
- **Ahora:** canal_servicio tiene TIENDA, DOMICILIO, WHATSAPP
- **Razón:** crearServicio tool de Nico necesita registrar órdenes de servicio con canal WHATSAPP. Sin este valor en el enum, crearServicioNico usaba TIENDA como fallback incorrecto.
- **Migración DB necesaria:**
  ```sql
  ALTER TYPE canal_servicio ADD VALUE IF NOT EXISTS 'WHATSAPP';
  ```
- **Impacto:** Al ejecutar la migración, los servicios creados vía WhatsApp pueden registrarse con canal=WHATSAPP correctamente. El código ya fue actualizado para usar este valor.

---

## [C007] 2026-06-02 — Nuevo módulo E19 Asistencia y Planilla
- **Afecta:** nuevo módulo, seguridad (tabla usuario), infraestructura (EventBridge)
- **Antes:** no existía módulo de asistencia ni planilla en el roadmap
- **Ahora:**
  - Nuevo módulo E19 con 12 tickets para control de asistencia del personal
  - 7 tablas nuevas: turno_trabajo, punto_control_wifi, trabajador_config, evento_asistencia, permiso_asistencia, planilla_mensual, planilla_detalle
  - Marcado de asistencia con doble validación: WiFi (SSID+BSSID) + GPS (haversine dentro de radio)
  - Cálculo automático de planilla mensual: tardanzas, faltas, horas extra, descuentos, bonificaciones
  - Portal PWA para trabajador (mismo patrón auth que portal servicios C002)
  - Panel admin tiempo real con estado de asistencia del día
  - Permisos y justificaciones con flujo de aprobación
  - Reportes exportables Excel/PDF
  - Integración EventBridge para notificar marcados inválidos
- **Razón:** requerimiento de negocio post E12 para control de personal del taller
- **Migración:** pendiente (se ejecutará en E19.1)
- **Impacto en roadmap:** se agrega E19 al final. No renumera épicas existentes. Total épicas: 19. Total tablas: 63 (56 + 7 nuevas).
- **Impacto en schema:** nuevo helper haversine en packages/shared/src/geo.ts

---

## C020 — 2026-06-07

**ID:** C020
**Afecta:** crm
**Contexto:** E13 — CRM webhook Meta

**`META_APP_SECRET` ausente devolvía 200 OK en vez de 403:**
`WebhookHandler.handle()` verificaba la presencia de `META_APP_SECRET` pero ante su ausencia ejecutaba `console.error` y retornaba `{ ok: true }` con status 200. Esto permitía que cualquier petición POST al webhook fuese aceptada silenciosamente sin validación HMAC cuando la variable no estaba configurada, violando la regla de C005 ("validación HMAC timing-safe obligatoria. Si falla → 403").

**Corrección aplicada:** `apps/api/src/modules/crm/http/handlers/webhook.handler.ts` — si `META_APP_SECRET` no está configurado, retorna inmediatamente `{ error: "webhook_not_configured" }` con status 403. Se eliminó el `console.error` porque un error de configuración de servidor debe manifestarse como respuesta de error, no silenciarse.

**Regla:** El webhook de Meta SIEMPRE debe retornar 403 si no puede validar HMAC, ya sea por firma inválida o por ausencia de `META_APP_SECRET`.

---

## C021 — 2026-06-07

**ID:** C021
**Afecta:** crm
**Contexto:** E13 — CRM wa_cuenta delete

**`deleteWaCuenta` hacía hard delete en lugar de soft delete:**
`CrmDrizzleRepository.deleteWaCuenta()` ejecutaba `.delete(waCuentaTable)` (borrado físico). La documentación del endpoint `DELETE /crm/wa-cuentas/:id` y el patrón del resto del módulo CRM (etapas, etiquetas) usan soft delete via `activo = false`. Además, otras tablas (`crm_lead`, `crm_conversacion`) tienen FK a `wa_cuenta.id`, por lo que un hard delete fallaría con violación de constraint si existen leads o conversaciones asociadas.

**Corrección aplicada:** `apps/api/src/modules/crm/infra/repositories/crm.drizzle.ts` — `.delete()` reemplazado por `.update({ activo: false })` en `deleteWaCuenta`.

**Regla:** ~~Toda entidad con relaciones dependientes (leads, conversaciones) debe usar soft delete. El hard delete solo aplica en tablas hoja sin dependencias.~~

> ⚠️ **Revertido en C025 (2026-06-07):** se descubrió que el toggle activo/inactivo ya cumple el rol de soft delete. El botón "Eliminar" debe hacer hard delete real con manejo de FK. Ver C025.

---

## C022 — 2026-06-07

**ID:** C022
**Afecta:** db, crm, servicios
**Contexto:** E13 — CRM crearServicio (C006 migración pendiente)

**`canal_servicio` enum no tenía el valor `WHATSAPP` en la DB:**
C006 (2026-06-02) documentó que se necesitaba `ALTER TYPE canal_servicio ADD VALUE IF NOT EXISTS 'WHATSAPP'` pero la migración nunca fue creada ni aplicada. El enum fue creado en `0016_e10_servicios_c002.sql` solo con `TIENDA` y `DOMICILIO`. El código de `crearServicioNico` en `crm.drizzle.ts` ya usaba `"WHATSAPP"` como valor, lo que habría causado violación de constraint en runtime al crear servicios vía WhatsApp.

**Corrección aplicada:**
- `packages/db/drizzle/0021_c006_canal_servicio_whatsapp.sql` — archivo de migración manual creado
- Migración aplicada en BD local (`reparatego_postgres` contenedor, puerto 5435): `ALTER TYPE` completado, enum ahora tiene `TIENDA | DOMICILIO | WHATSAPP`

**Verificación:** `SELECT enumlabel FROM pg_enum JOIN pg_type ON ... WHERE typname = 'canal_servicio'` devuelve 3 filas.

**Regla:** Cuando C005+ documenta una migración pendiente con `ALTER TYPE`, crear el archivo SQL en `packages/db/drizzle/` y aplicarlo antes de hacer cualquier test de la feature que lo requiere. El número de archivo sigue la secuencia manual (0021, 0022, ...).

---

## C023 — 2026-06-07

**ID:** C023
**Afecta:** crm
**Contexto:** E13 — CRM MetaSenderService

**`MetaSenderService` duplicaba la query `pgp_sym_decrypt` que ya existe en el repositorio:**
`sendTextMessage()` y `sendTemplateMessage()` contenían cada uno un bloque SQL con `pgp_sym_decrypt(access_token_encrypted, key)::text AS access_token`, duplicando exactamente la lógica de `CrmDrizzleRepository.getWaCuentaWithToken()`. Esto significaba que la clave de encriptación (`CRM_ENCRYPTION_KEY`) y la query de desencriptación tenían que mantenerse en dos lugares distintos. Además, `MetaSenderService` tenía dependencia directa sobre `DbClient` y `drizzle-orm/sql`, violando la separación de capas (infra/service → infra/repository).

**Corrección aplicada:**
- `apps/api/src/modules/crm/infra/services/meta-sender.ts` — constructor cambiado de `DbClient` a `ICrmRepository`. Ambos métodos usan `this.repo.getWaCuentaWithToken(tenantId, id)`. Eliminados imports de `DbClient`, `sql`, y la lógica de `CRM_ENCRYPTION_KEY`.
- `apps/api/src/modules/crm/http/routes.ts` — instanciación cambiada de `new MetaSenderService(db)` a `new MetaSenderService(repo)`.

**Regla:** Los servicios de infraestructura que necesitan datos persistidos deben usar el repositorio como fuente, no duplicar queries directas sobre el `DbClient`. La lógica de desencriptación de tokens debe vivir únicamente en `getWaCuentaWithToken()`.

---

## C024 — 2026-06-07

**ID:** C024
**Afecta:** crm, web

**Contexto:** E13 — CRM wa_cuenta edición completa

**`PUT /crm/wa-cuentas/:id` no permitía editar `phone_number_id` ni `waba_id`, y el formulario web los ocultaba en modo edición:**
`updateWaCuentaSchema`, `UpdateWaCuentaData` y el SQL UPDATE de `updateWaCuenta()` no incluían `phone_number_id` ni `waba_id`. Al abrir el modal de edición, estos campos no se mostraban (solo se mostraban al crear). Tampoco existía el botón "Generar nuevo token" para `webhook_verify_token` — el campo era un input de texto libre, lo que permitía editar el valor manualmente y romper la sincronización con Meta sin advertencia.

**Corrección aplicada:**
- `packages/validators/src/crm.ts` — `updateWaCuentaSchema` agrega `phone_number_id` y `waba_id` como campos opcionales
- `apps/api/src/modules/crm/domain/ports/crm.repository.ts` — `UpdateWaCuentaData` agrega `phone_number_id?: string | undefined` y `waba_id?: string | undefined`
- `apps/api/src/modules/crm/infra/repositories/crm.drizzle.ts` — `updateWaCuenta()` agrega fragmentos SQL condicionales para ambos campos en las dos ramas del UPDATE (con y sin access_token)
- `apps/web/src/modules/crm/pages/ConfigWaCuentasPage.tsx` — modal de edición ahora muestra `phone_number_id` y `waba_id` en modo edición; `webhook_verify_token` es `readOnly` con botón "Generar nuevo" que ejecuta `crypto.randomUUID()`; advertencia visible si se genera un nuevo token ("deberás actualizarlo también en Meta for Developers")

**Verificación:** `PUT /crm/wa-cuentas/d02e0fef-...` con `{ phone_number_id, waba_id, negocio_nombre, webhook_verify_token }` → 200 OK con datos actualizados.

**Regla:** `phone_number_id` y `waba_id` siempre son editables (tanto en create como en update) porque pueden cambiar al migrar entre cuentas de Meta. El campo `webhook_verify_token` admite escritura manual Y tiene botón "Generar nuevo" para generar un UUID v4 aleatorio vía `crypto.randomUUID()` — el admin decide si escribe el valor o lo genera.

> 📝 **Actualización 2026-06-09:** el campo `webhook_verify_token` fue cambiado de `readOnly` a editable manualmente a pedido explícito. La entrada original de C024 documentaba readonly; el estado real del código es editable + botón generar.

---

## C026 — 2026-06-08

**ID:** C026
**Afecta:** inventario, servicios, db, web

**Contexto:** E4 — Alcance de repuesto para cotización de servicios

**Problema — `buscarPresupuesto` no filtraba repuestos por contexto de la instancia:**
Al cotizar un servicio, la lista de repuestos disponibles incluía todos los productos del tenant sin considerar la categoría, marca o modelo del equipo del cliente. Esto generaba listas largas con repuestos irrelevantes, incrementando el riesgo de errores del vendedor.

**Decisión de diseño — campo `alcance` explícito vs. inferencia por joins:**
Se optó por un campo `alcance` en la tabla `producto` (GLOBAL/CATEGORIA/MARCA/COMPATIBILIDAD) en lugar de inferir el nivel dinámicamente desde las relaciones de `categoria_id`, `marca_id` y `producto_compatibilidad`. Ventajas: determinista, fácil de filtrar con un WHERE simple, visible en el UI sin joins adicionales.

**Correcciones aplicadas:**
- `packages/db/drizzle/0022_alcance_repuesto.sql` — `CREATE TYPE alcance_repuesto AS ENUM (...)` + `ALTER TABLE producto ADD COLUMN alcance alcance_repuesto DEFAULT 'GLOBAL'`
- `packages/shared/src/enums.ts` — enum `AlcanceRepuesto` (GLOBAL/CATEGORIA/MARCA/COMPATIBILIDAD)
- `packages/db/src/schema/inventario.ts` — `alcanceRepuestoEnum` + columna `alcance` en tabla `producto`
- `packages/validators/src/inventario.ts` — `alcance: z.nativeEnum(AlcanceRepuesto).optional()` en `createProductoSchema`
- `apps/api/src/modules/inventario/domain/entities/producto.ts` — campo `alcance: AlcanceRepuesto | null`
- `apps/api/src/modules/inventario/domain/ports/producto.repository.ts` — `alcance?` en `CreateProductoData` y `UpdateProductoData`
- `apps/api/src/modules/inventario/infra/repositories/producto.drizzle.ts` — persiste `alcance` en create y update
- `apps/api/src/modules/servicios/infra/repositories/servicio.drizzle.ts` → `buscarPresupuesto()` reescrito con condiciones `or(isNull, eq GLOBAL, eq CATEGORIA, eq MARCA)` + subquery Drizzle para COMPATIBILIDAD. También corrige bug: mapeo `"REPUESTO"→"PRODUTO"` que hacía que el tipo param nunca coincidiera con el enum DB
- `apps/web/src/modules/inventario/types/inventario.ts` — `alcance` en `ProductoDto`
- `apps/web/src/modules/inventario/pages/ProductoFormPage.tsx` — select alcance (solo tipo=PRODUCTO), incluido en create y update body
- `apps/web/src/modules/inventario/pages/ProductosPage.tsx` — `AlcanceBadge` coloreado, columna alcance en tabla, filtro por alcance

**Bug colateral corregido:** `buscarPresupuesto` recibía `params.tipo = "REPUESTO"` (TipoItemCotizacion) pero comparaba contra el enum DB `"PRODUCTO"`. El nuevo código mapea explícitamente antes del WHERE.

**Regla:** Todo producto tipo PRODUCTO debe tener `alcance` definido. El default GLOBAL garantiza compatibilidad con productos creados antes de la migración.

---

## C025 — 2026-06-07

**ID:** C025
**Afecta:** crm

**Contexto:** E13 — CRM wa_cuenta delete real

**`DELETE /crm/wa-cuentas/:id` hacía soft delete, idéntico al toggle de activar/desactivar:**
C021 cambió `deleteWaCuenta` de hard delete a soft delete (`activo = false`) por precaución ante FK constraints. Sin embargo, el módulo ya tiene un toggle independiente de activar/desactivar con ese mismo efecto. El botón "Eliminar" del UI no eliminaba nada — solo desactivaba la cuenta que seguía apareciendo en la lista.

**Corrección aplicada:**
- `apps/api/src/modules/crm/infra/repositories/crm.drizzle.ts` — `deleteWaCuenta` vuelve a hard delete (`.delete()`). Si PostgreSQL retorna error de FK (código `23503`), lanza `Error("WA_CUENTA_HAS_DEPENDENTS")`.
- `apps/api/src/modules/crm/http/handlers/wa-cuentas.handler.ts` — captura `WA_CUENTA_HAS_DEPENDENTS` y retorna 409 con mensaje claro: "tiene leads o conversaciones asociadas. Desactívala con el toggle."

**Verificación:** `DELETE /crm/wa-cuentas/:id` → 200 y registro eliminado de DB. Cuenta sin dependentes: eliminación exitosa. Cuenta con leads: 409.

**Regla:** El toggle (activo/inactivo) y el botón Eliminar cumplen roles distintos. El toggle pausa la cuenta sin perder datos. El botón Eliminar borra físicamente — solo posible si no hay leads ni conversaciones vinculadas.

---

## C026 — 2026-06-09

**ID:** C026
**Afecta:** api (múltiples módulos)
**Contexto:** E13 — fix authMiddleware path en routes

**`authMiddleware` sin path explícito bloqueaba rutas públicas en algunos módulos:**
Varios módulos usaban `routes.use(authMiddleware)` sin path, aplicando el middleware a TODAS las rutas del router incluyendo las que deben ser públicas (ej: webhook GET/POST en CRM, health checks). Esto causaba que rutas registradas antes del `use()` en el mismo router pudieran verse afectadas por orden de registro, dependiendo del framework version.

**Corrección aplicada:** 20 archivos `routes.ts` cambiados de `routes.use(authMiddleware)` a `routes.use("/ventas/*", authMiddleware)` (o el path base correspondiente a cada módulo). El path explícito garantiza que solo se aplica el middleware a las rutas protegidas, independientemente del orden de registro.

**Archivos afectados:** cajas, categorias, clientes, componentes, cotizaciones-compra, cotizaciones-venta, domicilios, feature-flags, inventario, marcas, modelos, ordenes-compra, pagos-proveedor, portal, proveedores, servicios, solicitudes-compra, sucursales, usuarios, ventas.

**Regla:** `routes.use(middleware)` sin path aplica el middleware a todas las rutas del router, incluso las definidas después. Siempre usar path explícito: `routes.use("/base-path/*", middleware)`.

---

## C027 — 2026-06-09

**ID:** C027
**Afecta:** crm, web
**Contexto:** E13 — CRM ConfigAgentesPage + useCreateAgente

**`ConfigAgentesPage` no tenía modal de creación de agentes y `useCrm.ts` no exportaba `useCreateAgente`:**
La página `/crm/config/agentes` solo permitía editar agentes existentes. No existía forma de crear un agente nuevo desde el UI, y el hook `useCreateAgente` no estaba implementado en `useCrm.ts` a pesar de que el endpoint `POST /crm/agentes` ya existía en la API.

**Corrección aplicada:**
- `apps/web/src/modules/crm/hooks/useCrm.ts` — agrega `useCreateAgente()` mutation que llama `POST /crm/agentes`
- `apps/web/src/modules/crm/pages/ConfigAgentesPage.tsx` — agrega `NuevoAgenteModal` con selector visual de modelo Claude (radio buttons con etiqueta de costo por 1M tokens): Haiku 4.5 (`claude-haiku-4-5-20251001`), Sonnet 4.6 (`claude-sonnet-4-6`), Opus 4.8 (`claude-opus-4-8`). El selector (`ModelIaSelect`) se reutiliza también en el formulario de edición de agente existente.

**Regla:** Cuando un endpoint POST existe en la API, el UI debe tener el formulario de creación correspondiente. No dejar endpoints huérfanos sin interfaz.

---

## C028 — 2026-06-08

**ID:** C028
**Afecta:** inventario, db, web

**Contexto:** E4 — Gestión de precios de repuestos

**Regla de negocio establecida:**
- `precio_venta` lo gestiona el módulo **Tasas %**: se calcula como `ultimo_costo × (1 + tasa_valor)` aplicando jerarquía POR_REPUESTO > POR_TIPO > POR_COMPONENTE. No es editable en el form de repuesto.
- `precio_compra` lo fija el **movimiento de ingreso** (INGRESO) vinculado a la cotización del proveedor. Si el repuesto no tiene movimientos, se promedia el `precio_unitario` de las cotizaciones asociadas. No es editable en el form de repuesto.

**Problema:** El form de repuesto (`ProductoFormPage`) tenía inputs editables para `precio_venta` y `precio_compra`, lo que rompía la regla de negocio: el vendedor podía sobreescribir precios que deben derivarse de Tasas y Movimientos.

**Correcciones aplicadas:**
- `packages/db/drizzle/0023_precio_venta_default.sql` — `ALTER TABLE producto ALTER COLUMN precio_venta SET DEFAULT 0` (permite INSERT sin enviar el campo)
- `packages/db/src/schema/inventario.ts` — `.default("0")` en columna `precio_venta`
- `packages/validators/src/inventario.ts` — eliminados `precio_venta: z.number().positive()` y `precio_compra: z.number().positive().optional()` de `createProductoSchema`; reemplazados por comentarios que explican la regla
- `apps/api/src/modules/inventario/domain/ports/producto.repository.ts` — eliminados de `CreateProductoData`; en `UpdateProductoData` renombrados a `_precio_compra` y `_precio_venta` (prefijo underscore = camino interno, no desde el form)
- `apps/api/src/modules/inventario/infra/repositories/producto.drizzle.ts` — `create()` sin precio_venta/precio_compra; `update()` usa `_precio_compra`/`_precio_venta`
- `apps/api/src/modules/inventario/domain/use-cases/create-producto.ts` — eliminadas líneas `precio_venta` y `precio_compra`
- `apps/api/src/modules/inventario/domain/use-cases/update-producto.ts` — eliminadas líneas `precio_compra` y `precio_venta`
- `apps/web/src/modules/inventario/pages/ProductoFormPage.tsx` — inputs de precio eliminados del form schema, defaultValues, reset y onSubmit; reemplazados por panel `PreciosInfo` (solo lectura) que muestra los valores actuales con nota de origen

**Regla:** `precio_venta` y `precio_compra` nunca se envían desde el form de repuesto. Solo se actualizan desde los servicios de Tasas y Movimientos de Ingreso respectivamente.

---

## C031 — 2026-06-08

**ID:** C031
**Afecta:** proveedores, db, api, web
**Contexto:** telefono3 + actualización completa del frontend de proveedores

**DB:**
- `packages/db/drizzle/0026_proveedor_telefono3.sql` — `ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS telefono3 VARCHAR(20)`
- `packages/db/src/schema/proveedores.ts` — `telefono3` añadido al proveedor table

**API:**
- `packages/validators/src/proveedores.ts` — `telefono3` añadido a createProveedorSchema/updateProveedorSchema
- `domain/entities/proveedor.ts` — `telefono3: string | null` en Proveedor
- `domain/ports/proveedor.repository.ts` — `telefono3` en CreateProveedorData y UpdateProveedorData
- `domain/use-cases/create-proveedor.ts` y `update-proveedor.ts` — spread condicional para telefono3
- `infra/repositories/proveedor.drizzle.ts` — telefono3 en create y update

**Web — tipos y hooks:**
- `types/proveedor.ts` — `CondicionPagoDto` añadido; `ProveedorDto` con todos los campos nuevos (contacto_nombre, telefono2, telefono3, departamento, condicion_pago_id, observaciones); `ProveedorMetodoPagoDto` con `tipo_cuenta`; `CondicionPagoListResponse` + `CondicionPagoResponse` nuevos
- `hooks/useProveedores.ts` — importa tipos condicion_pago; añadidos `useCondicionesPago`, `useCreateCondicionPago`, `useUpdateCondicionPago`, `useDeleteCondicionPago`

**Web — páginas:**
- `ProveedoresPage.tsx` — formulario ampliado con contacto_nombre, telefono2, telefono3, departamento, observaciones
- `ProveedorDetallePage.tsx`:
  - Tab por defecto cambiado a "Líneas que abastecen"
  - Orden de tabs: Líneas → Contactos → Métodos de pago
  - Datos generales: muestra contacto_nombre, telefono (3 números), departamento, observaciones
  - MetodoPagoModal: campo grupo (tipo_cuenta banco/monedero)
  - MetodosPagoTab: badge de tipo_cuenta (azul=banco, púrpura=monedero)
  - ProveedorEditModal: todos los campos nuevos incluidos

---

## C030 — 2026-06-08

**ID:** C030
**Afecta:** proveedores, db, api
**Contexto:** Adaptación estructura proveedores al modelo de referencia

**Cambios aplicados:**

**DB — nueva tabla `condicion_pago`:**
- `migración 0025_proveedores_condicion_pago.sql`
- Campos: nombre, dias_credito, es_default, activo. UNIQUE (tenant_id, nombre)
- RLS habilitado

**DB — nuevos campos en `proveedor`:**
- `contacto_nombre VARCHAR(100)` — contacto principal directo
- `telefono2 VARCHAR(20)` — teléfono secundario
- `departamento VARCHAR(100)` — departamento del país (texto libre)
- `condicion_pago_id UUID FK → condicion_pago.id`
- `observaciones TEXT` — campo adicional (notas se mantiene)

**DB — nuevo campo en `proveedor_metodo_pago`:**
- `tipo_cuenta VARCHAR(20)` — grupo "banco" o "monedero"

**API — nuevos endpoints:**
- `GET /proveedores/condiciones-pago`
- `POST /proveedores/condiciones-pago`
- `PUT /proveedores/condiciones-pago/:id`
- `DELETE /proveedores/condiciones-pago/:id` (soft-delete)

**Archivos modificados:** `packages/db/schema/proveedores.ts`, `packages/validators/src/proveedores.ts`, `domain/entities`, `domain/ports`, `domain/use-cases` (4 nuevos para condicion_pago), `infra/repositories`, `http/validators`, `http/handlers`, `http/routes`

**Regla:** `proveedor_linea` no cambia — proveedores siguen usando solo `categoria_id + componente_id` para clasificación.

---

## C029 — 2026-06-08

**ID:** C029
**Afecta:** compras, db, web, inventario

**Contexto:** E6 — Rediseño radical de cotizaciones

**Regla de negocio establecida:**
- Una cotización = selección de un proveedor para un repuesto con su precio. No tiene estado, ni multi-ítem, ni fechas.
- Los proveedores tienen "Líneas que abastecen" (categoría + componente) para filtrar cuáles pueden atender un repuesto.
- Al crear cotización: seleccionar repuesto → ver proveedores sugeridos por líneas → enviar WhatsApp → registrar precio.

**Problema:** `cotizacion_compra` era un documento multi-ítem con estado (PENDIENTE/COTIZADA), `cotizacion_compra_detalle` con los repuestos, y `estado_cotizacion_compra` enum. Esto era innecesariamente complejo para la necesidad real: registrar el precio de un proveedor para un repuesto.

**Correcciones aplicadas:**

**DB:**
- `packages/db/drizzle/0024_simplify_cotizacion.sql` — migración: TRUNCATE + DROP detalle, DROP columnas viejas, ADD `producto_id UUID NOT NULL` + `precio_unitario DECIMAL(12,2)`, UNIQUE INDEX `(tenant_id, proveedor_id, producto_id)`, DROP ENUM `estado_cotizacion_compra`
- `packages/db/src/schema/compras.ts` — tabla simplificada a: id, tenant_id, proveedor_id, producto_id, precio_unitario, notas, timestamps; sin `cotizacionCompraDetalle`, sin `estadoCotizacionCompraEnum`

**Validators:**
- `packages/validators/src/compras.ts` — `createCotizacionCompraSchema`: solo proveedor_id, producto_id, precio_unitario?, notas?; `updateCotizacionCompraSchema`: precio_unitario?, notas?; eliminados todos los tipos viejos (EstadoCotizacionCompra, CreateCotizacionCompraDetalleInput, etc.)

**API:**
- `apps/api/src/modules/cotizaciones-compra/domain/entities/cotizacion-compra.ts` — entidad simplificada
- `apps/api/src/modules/cotizaciones-compra/domain/ports/cotizacion-compra.repository.ts` — interfaz con: list, findById, create, update, delete, getWhatsapp
- `apps/api/src/modules/cotizaciones-compra/infra/repositories/cotizacion-compra.drizzle.ts` — implementación completa con getWhatsapp (genera URL `wa.me` desde teléfono del proveedor/contacto)
- `apps/api/src/modules/cotizaciones-compra/http/` — handlers, validators y routes reescritos; POST devuelve 409 si ya existe (proveedor+producto)
- `apps/api/src/modules/inventario/infra/repositories/stock.drizzle.ts` — `cotizaciones_pendientes` del dashboard ahora cuenta `IS NULL precio_unitario` en lugar de `estado='PENDIENTE'`
- `apps/api/src/modules/inventario/http/` — eliminado `getMensajeWhatsappHandler` y ruta `GET /inventario/cotizaciones/:id/mensaje-whatsapp/:detalleId`

**Web:**
- `apps/web/src/modules/compras/types/cotizacion.ts` — tipos simplificados
- `apps/web/src/modules/compras/hooks/useCotizaciones.ts` — hooks para el nuevo modelo
- `apps/web/src/modules/compras/pages/CotizacionesPage.tsx` — flujo: buscar repuesto → ver proveedores sugeridos (seguros/posibles) → WhatsApp por proveedor → registrar precio; lista con editar/eliminar
- `apps/web/src/modules/compras/pages/ComparadorPage.tsx` — adaptado al nuevo modelo (sin estado, sin detalles; filtra por precio_unitario IS NOT NULL)
- `apps/web/src/modules/proveedores/pages/ProveedorDetallePage.tsx` — tab "Líneas" renombrado a "Líneas que abastecen"
- `apps/web/src/modules/inventario/hooks/useInventario.ts` — eliminado `useMensajeWhatsapp` (endpoint ya no existe)

**Regla:** `cotizacion_compra` tiene exactamente una fila por (tenant, proveedor, repuesto). No hay estados. `precio_unitario` NULL = sin precio aún. El WhatsApp se genera client-side con el teléfono del proveedor sugerido.

---

## [C008] 2026-06-09 — Agregar modelo_id a tabla producto y validar instancia solo con equipos
- **Afecta:** inventario, servicios
- **Antes:**
  - Tabla producto no tenía modelo_id como FK. La relación equipo↔modelo no existía directamente.
  - producto_compatibilidad era la única relación con modelo, diseñada para repuestos, no equipos.
  - instancia.producto_id no validaba que el producto fuera un equipo (componente_id IS NULL). Bug confirmado: una instancia apunta a un repuesto (Batería Apple).
  - Dos equipos con misma categoría+marca (ej: Galaxy S24 y Galaxy A15, ambos Celulares+Samsung) no se podían distinguir porque no había modelo_id.
- **Ahora:**
  - Se agrega campo modelo_id (FK a modelo, nullable) en tabla producto
  - Para equipos: modelo_id es obligatorio. Combinación categoria_id + marca_id + modelo_id identifica un equipo único
  - Para repuestos: modelo_id sigue siendo null. La relación con modelos sigue vía producto_compatibilidad
  - Se agrega CHECK constraint o validación en API: instancia.producto_id solo acepta productos con componente_id IS NULL (equipos)
  - Flujo NuevaOrden: Categoría → Marca → Modelo → sistema busca/crea producto automáticamente con esa combinación
  - Limpiar dato corrupto: eliminar instancia que apunta a repuesto (Batería Apple)
- **Razón:** gap de diseño que impedía identificar equipos por modelo y permitía crear instancias con repuestos
- **Migración:** ALTER TABLE producto ADD COLUMN modelo_id UUID REFERENCES modelo(id); limpiar instancias corruptas
