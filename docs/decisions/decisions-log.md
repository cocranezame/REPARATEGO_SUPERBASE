# Decisions Log — ReparaTego

> Registro de Architecture Decision Records (ADRs).
> Formato: contexto → decisión → consecuencias.

---

## [ADR-001] 2026-05-25 — Stack tecnológico

- **Contexto:** Se necesita un SaaS web responsive para gestión de taller de reparaciones en Lima Norte. Debe soportar multi-sucursal, multi-usuario, y escalar a mobile luego.
- **Decisión:** Turborepo monorepo, Hono API (Node.js 20 + TS), React 18 + Vite + Tailwind (Web), Supabase (DB + Auth), Drizzle ORM, SST v3 (AWS Lambda), Vercel (Web).
- **Consecuencias:** DDD ports & adapters permite cambiar infra sin tocar dominio. Drizzle da type-safety total. Supabase simplifica auth + RLS. Desarrollo local primero, deploy al final.

## [ADR-002] 2026-05-25 — Desarrollo local primero

- **Contexto:** Se evaluó si usar Supabase cloud desde el inicio o desarrollar localmente.
- **Decisión:** Todo el desarrollo contra DB local (Docker Compose con Postgres + Supabase local). Deploy a producción (Supabase cloud, AWS, Vercel) al final después de validar épicas 1-15.
- **Consecuencias:** Más rápido en desarrollo, sin costos de cloud durante desarrollo, pero requiere migración al final.

## [ADR-004] 2026-05-27 — RLS tenant isolation: current_setting (local) vs auth.jwt() (producción)

- **Contexto:** Las tablas de seguridad requieren aislamiento por tenant via RLS. En local (Postgres Docker) no hay Supabase Auth, por lo que `auth.jwt()` no está disponible. El middleware de API debe inyectar el tenant_id en cada request.
- **Decisión:** En local, usar `NULLIF(current_setting('app.tenant_id', true), '')::uuid`. La API setea la variable con `SET LOCAL app.tenant_id = '<uuid>'` al inicio de cada transacción. `NULLIF` maneja el caso de RESET (string vacío → NULL). En producción (Supabase), las policies se reemplazarán por `auth.jwt() ->> 'tenant_id'` en una migración de deploy (E0D).
- **Consecuencias:** RLS funciona en local contra el rol `postgres` solo con `FORCE ROW LEVEL SECURITY` (superusuario bypasea sin FORCE). El rol `app_user` (no-superusuario) respeta las policies correctamente. En producción, Supabase inyecta el JWT automáticamente y no se requiere `SET LOCAL`.

## [ADR-003] 2026-05-25 — Web responsive primero, mobile y SUNAT al final

- **Contexto:** Se evaluó si desarrollar mobile en paralelo.
- **Decisión:** Web responsive primero (épicas 1-15), mobile como épica 16, integración SUNAT como épica 17.
- **Consecuencias:** Un solo frontend que mantener durante desarrollo. Mobile se implementa después de validar toda la lógica.
