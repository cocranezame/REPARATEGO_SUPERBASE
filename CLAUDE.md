# REPARATEGO — Guía de Proyecto

> SaaS de gestión de taller de reparaciones (celulares, laptops, TVs, electrodomésticos)
> Negocio ubicado en Lima Norte, Perú
> Organización: @kallpasoft | Repo: github.com/cocranezame/REPARATEGO_SUPERBASE

## Stack
- **Monorepo:** Turborepo + pnpm workspaces
- **API:** Node.js 20 + TypeScript + Hono (DDD ports & adapters, screaming architecture)
- **Web:** React 18 + Vite + Tailwind CSS + TanStack Query
- **DB:** Supabase (PostgreSQL) + Drizzle ORM
- **Deploy:** SST v3 (AWS Lambda) + Vercel (Web) + S3 (imágenes)
- **Auth:** Supabase Auth (JWT + RLS)
- **Scope:** @kallpasoft

→ docs/stack/architecture.md
→ docs/stack/conventions.md
→ docs/stack/commands.md
→ docs/stack/env-vars.md

## ⚠️ Correcciones activas (LEER SIEMPRE ANTES DE CODEAR)
→ docs/decisions/corrections-log.md

## Decisiones técnicas
→ docs/decisions/decisions-log.md

## Base de datos
→ docs/db/schema-overview.md (mapa general)
→ docs/db/modules/{modulo}.md (detalle por módulo)
→ docs/db/modules/asistencia.md

## API
→ docs/api/api-overview.md
→ docs/api/modules/{modulo}.md
→ docs/api/modules/asistencia.md

## Web
→ docs/web/web-overview.md
→ docs/web/design-system.md
→ docs/web/modules/{modulo}.md
→ docs/web/modules/asistencia.md

## Roadmap
→ docs/roadmap/epics-overview.md
→ docs/roadmap/epics/E{nn}-{nombre}.md
→ docs/roadmap/epics/E19-asistencia.md

## Reglas de negocio
→ docs/business/entities-map.md
→ docs/business/business-rules.md
→ docs/business/glossary.md

## Reglas de mantenimiento
1. **CLAUDE.md nunca crece** — si hay info nueva, va a la carpeta correspondiente
2. **corrections-log.md se actualiza en el momento** — nunca "después"
3. **Cada módulo DB/API/Web tiene su .md** — se actualiza al completar tickets de ese módulo
4. **decisions-log.md** registra ADRs con formato: contexto → decisión → consecuencias
5. **epics-overview.md** se actualiza al cambiar estado de cada épica/ticket
