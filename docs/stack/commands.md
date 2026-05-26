# Comandos — ReparaTego

> Se actualizará a medida que se configuren las herramientas.

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
