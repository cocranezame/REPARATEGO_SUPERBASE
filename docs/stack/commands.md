# Comandos — ReparaTego

> Se actualizará a medida que se configuren las herramientas.

## Setup local (primera vez)

```bash
git clone https://github.com/cocranezame/REPARATEGO_SUPERBASE.git
cd REPARATEGO_SUPERBASE
pnpm install               # Instalar dependencias del monorepo
cp .env.example .env       # Crear .env local (ajustar si hay conflicto de puertos)
pnpm build                 # Compilar packages (db, shared, validators)
docker compose up -d       # Levantar Postgres en localhost:5435
pnpm db:migrate            # Aplicar migraciones a la DB local
pnpm db:seed               # Insertar datos de prueba
pnpm dev                   # Levantar API (localhost:3001) + Web (localhost:5173)
```

> **Notas:**
> - `pnpm build` es necesario antes de `pnpm dev` para que la API resuelva los tipos de `@kallpasoft/db`.
> - Postgres corre en el puerto **5435** (no 5432) para evitar conflictos con otras instancias locales (ver C006).
> - `pnpm db:seed` es idempotente: puede correr múltiples veces sin duplicar datos.

### Credenciales de prueba (post-seed)

| Usuario   | DNI      | Password     | Rol      |
|-----------|----------|--------------|----------|
| Admin     | 12345678 | admin123     | ADMIN    |
| Carlos    | 87654321 | tecnico123   | TECNICO  |
| María     | 11223344 | vendedor123  | VENDEDOR |

- **Tenant ID:** `a0000000-0000-0000-0000-000000000001`
- **Sucursal:** Sede Central Lima Norte (Los Olivos)

### URLs de verificación

| Endpoint                        | Esperado |
|---------------------------------|----------|
| GET http://localhost:3001/api/v1/health/db | `{ "success": true, "data": { "status": "ok" } }` |
| POST http://localhost:3001/api/v1/auth/login | 200 con `access_token` (ver body abajo) |
| http://localhost:5173            | Web app  |

**Body de login:**
```json
{
  "tipo_documento": "DNI",
  "numero_documento": "12345678",
  "password": "admin123"
}
```
**Header requerido:** `X-Tenant-Id: a0000000-0000-0000-0000-000000000001`

> **Nota API dev:** el script usa `node --watch bootstrap.cjs` (no `tsx watch` directo) para garantizar que dotenv cargue el `.env` ANTES de que los módulos TypeScript inicialicen sus repositorios. Ver C015.

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
