# Comandos — ReparaTego

> Se actualizará a medida que se configuren las herramientas.

## Setup local (primera vez)

```bash
git clone https://github.com/cocranezame/REPARATEGO_SUPERBASE.git
cd REPARATEGO_SUPERBASE
pnpm install               # Instalar dependencias del monorepo
cp .env.example .env       # Crear .env local (editar con tus valores si aplica)
pnpm build                 # Compilar packages (db, shared, validators)
docker compose up -d       # Levantar Postgres en localhost:5432
pnpm db:generate           # Generar primera migración SQL desde el schema
pnpm db:migrate            # Aplicar migraciones a la DB local
pnpm dev                   # Levantar API (localhost:3001) + Web (localhost:5173)
```

> **Nota:** `pnpm build` es necesario antes de `pnpm dev` para que la API resuelva
> los tipos de `@kallpasoft/db`.

## General (monorepo)

```bash
pnpm install              # Instalar dependencias
pnpm dev                  # Dev mode (API + Web en paralelo)
pnpm build                # Build de producción
pnpm lint                 # Lint con Biome
pnpm format               # Format con Biome
pnpm typecheck            # TypeScript check
```

## API

```bash
pnpm --filter @kallpasoft/api dev     # Dev mode API
pnpm --filter @kallpasoft/api build   # Build API
```

## Web

```bash
pnpm --filter @kallpasoft/web dev     # Dev mode Web
pnpm --filter @kallpasoft/web build   # Build Web
```

## Base de datos

```bash
pnpm --filter @kallpasoft/db generate    # Generar migración
pnpm --filter @kallpasoft/db migrate     # Ejecutar migraciones
pnpm --filter @kallpasoft/db studio      # Drizzle Studio (visual)
pnpm --filter @kallpasoft/db push        # Push schema a DB
```

## Docker (local)

```bash
docker compose up -d      # Levantar Postgres + Supabase local
docker compose down        # Bajar servicios
docker compose logs -f     # Ver logs
```
