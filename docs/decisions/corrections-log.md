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
