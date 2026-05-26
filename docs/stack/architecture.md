# Arquitectura — ReparaTego

## Monorepo (Turborepo + pnpm)

```
REPARATEGO_SUPERBASE/
├── apps/
│   ├── api/          ← Hono API (DDD ports & adapters)
│   └── web/          ← React 18 + Vite + Tailwind
├── packages/
│   ├── db/           ← @kallpasoft/db (Drizzle schema, migraciones, cliente)
│   ├── shared/       ← @kallpasoft/shared (tipos, constantes, enums)
│   └── validators/   ← @kallpasoft/validators (schemas Zod compartidos)
├── docs/             ← Documentación del proyecto
├── infra/            ← SST v3 config (deploy)
├── turbo.json
├── pnpm-workspace.yaml
└── CLAUDE.md
```

## API — DDD Ports & Adapters (Screaming Architecture)

```
apps/api/src/
├── modules/
│   ├── seguridad/
│   │   ├── domain/          ← Entidades, value objects, interfaces de repositorio
│   │   ├── application/     ← Casos de uso
│   │   ├── infrastructure/  ← Implementación de repositorios (Drizzle)
│   │   └── interface/       ← Rutas Hono (controllers)
│   ├── catalogos/
│   ├── clientes/
│   ├── inventario/
│   ├── proveedores/
│   ├── compras/
│   ├── servicios/
│   ├── ventas/
│   ├── domicilios/
│   ├── pagos-proveedores/
│   └── crm/
├── shared/
│   ├── middleware/     ← Auth, error handling, logging
│   ├── utils/
│   └── types/
└── index.ts            ← Entry point Hono app
```

## Web — React 18 + Vite

```
apps/web/src/
├── modules/
│   ├── seguridad/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/    ← API calls (TanStack Query)
│   ├── catalogos/
│   ├── clientes/
│   └── ...
├── shared/
│   ├── components/      ← UI components base
│   ├── layouts/
│   ├── hooks/
│   └── utils/
├── router.tsx
└── main.tsx
```

## Base de datos

- **Motor:** PostgreSQL 15 (Supabase)
- **ORM:** Drizzle ORM
- **Auth:** Supabase Auth (JWT)
- **RLS:** Row Level Security por tenant_id
- **Migraciones:** Drizzle Kit

## Deploy (fase final)

- **API:** AWS Lambda via SST v3 (región São Paulo sa-east-1)
- **Web:** Vercel
- **DB:** Supabase (región São Paulo)
- **Imágenes:** AWS S3
- **CI/CD:** GitHub Actions
