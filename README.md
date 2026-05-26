# REPARATEGO

> SaaS de gestión de taller de reparaciones (celulares, laptops, TVs, electrodomésticos)

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **API:** Node.js 20 + TypeScript + Hono
- **Web:** React 18 + Vite + Tailwind CSS
- **DB:** Supabase (PostgreSQL) + Drizzle ORM
- **Deploy:** SST v3 (AWS Lambda) + Vercel
- **Auth:** Supabase Auth

## Estructura

```
├── apps/
│   ├── api/          # API REST (Hono + DDD)
│   └── web/          # Frontend (React + Vite)
├── packages/
│   ├── db/           # Schema Drizzle + migraciones
│   ├── shared/       # Tipos y constantes compartidas
│   └── validators/   # Schemas Zod
├── docs/             # Documentación del proyecto
└── infra/            # SST v3 (deploy)
```

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Documentación

Ver [CLAUDE.md](./CLAUDE.md) para el índice completo de documentación.

---

Desarrollado por [KallpaSoft](https://github.com/cocranezame)
