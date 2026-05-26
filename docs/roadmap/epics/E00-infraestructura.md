# E00 — Infraestructura y Scaffolding

## Fase Local

| Ticket | Descripción | Estado |
|--------|-------------|--------|
| E0.1 | Crear repositorio REPARATEGO_SUPERBASE + estructura docs + CLAUDE.md | ✅ DONE |
| E0.2 | Poblar contenido docs con info definida en planificación | ⬜ TODO |
| E0.3 | Scaffoldear monorepo con Turborepo + pnpm workspaces | ⬜ TODO |
| E0.4 | Configurar Biome + Husky + commitlint | ⬜ TODO |
| E0.5 | Configurar TypeScript estricto (tsconfig base + por paquete) | ⬜ TODO |
| E0.6 | Crear paquete @kallpasoft/shared (tipos, constantes, enums) | ⬜ TODO |
| E0.7 | Crear paquete @kallpasoft/validators (schemas Zod compartidos) | ⬜ TODO |
| E0.8 | Crear paquete @kallpasoft/db (schema Drizzle, migraciones, cliente) | ⬜ TODO |
| E0.9 | Scaffoldear app API con Hono (estructura DDD ports & adapters) | ⬜ TODO |
| E0.10 | Scaffoldear app Web con Vite + React 18 + Tailwind + TanStack Query | ⬜ TODO |
| E0.11 | Configurar Sentry (web + API) | ⬜ TODO |
| E0.12 | Configurar Docker Compose (Postgres local + Supabase local) | ⬜ TODO |
| E0.13 | Smoke test local (API responde, Web carga, DB conecta) | ⬜ TODO |

## Fase Deploy (se ejecuta después de E1-E15)

| Ticket | Descripción | Estado |
|--------|-------------|--------|
| E0.14 | Crear proyecto en Supabase (región São Paulo) | ⬜ TODO |
| E0.15 | Configurar Supabase Auth (JWT + RLS) | ⬜ TODO |
| E0.16 | Migrar DB local → Supabase | ⬜ TODO |
| E0.17 | Configurar SST v3 (Lambda + API Gateway, región São Paulo) | ⬜ TODO |
| E0.18 | Configurar deploy Web en Vercel | ⬜ TODO |
| E0.19 | Configurar S3 para imágenes/evidencias | ⬜ TODO |
| E0.20 | Configurar GitHub Actions (CI: typecheck, lint, test, build) | ⬜ TODO |
| E0.21 | Configurar GitHub Actions (CD: deploy API + Web) | ⬜ TODO |
| E0.22 | Configurar variables de entorno y secrets en producción | ⬜ TODO |
| E0.23 | Configurar AWS Powertools (logger, tracer, metrics) | ⬜ TODO |
| E0.24 | Smoke test producción (end-to-end completo) | ⬜ TODO |
