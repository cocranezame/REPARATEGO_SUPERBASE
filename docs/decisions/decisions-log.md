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

## [ADR-003] 2026-05-25 — Web responsive primero, mobile y SUNAT al final

- **Contexto:** Se evaluó si desarrollar mobile en paralelo.
- **Decisión:** Web responsive primero (épicas 1-15), mobile como épica 16, integración SUNAT como épica 17.
- **Consecuencias:** Un solo frontend que mantener durante desarrollo. Mobile se implementa después de validar toda la lógica.
