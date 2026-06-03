# Variables de Entorno — ReparaTego

> Se actualizará a medida que se configuren los servicios.

## Local (.env)

```env
# Base de datos (Postgres local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5435/reparatego_dev

# Supabase local
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<generado por supabase local>
SUPABASE_SERVICE_ROLE_KEY=<generado por supabase local>

# API
API_PORT=3001
API_HOST=localhost
NODE_ENV=development
JWT_SECRET=dev-secret-change-me-in-production  # min 32 chars en producción

# Web
VITE_API_URL=http://localhost:3001/api/v1
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<generado por supabase local>

# Sentry (opcional en local)
SENTRY_DSN=
VITE_SENTRY_DSN=

# CRM (C005) — pgcrypto para access_token de cuentas WhatsApp
CRM_ENCRYPTION_KEY=dev-crm-key-change-me-in-production  # min 16 chars en producción
```

## Producción (se configura en fase deploy)

```env
# Supabase cloud
DATABASE_URL=<supabase cloud connection string>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<producción>
SUPABASE_SERVICE_ROLE_KEY=<producción>

# AWS (SST)
AWS_REGION=sa-east-1

# S3
S3_BUCKET=reparatego-files
S3_REGION=sa-east-1

# Sentry
SENTRY_DSN=<producción>
VITE_SENTRY_DSN=<producción>
```
