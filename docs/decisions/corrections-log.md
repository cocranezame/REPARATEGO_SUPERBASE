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
