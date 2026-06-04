// Carga .env del monorepo root ANTES de que cualquier módulo TypeScript se importe.
// CWD cuando corre desde apps/api → ../../.env es la raíz del monorepo.
require("dotenv").config({ path: "../../.env" });

// Libera el puerto si está ocupado de una sesión anterior (evita EADDRINUSE en --watch).
const { execSync } = require("child_process");
const port = process.env.API_PORT ?? "3001";
try {
  execSync(
    `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"`,
    { stdio: "ignore" }
  );
} catch (_) {}

// Registra el hook CJS de tsx para que Node pueda importar .ts directamente.
require("tsx/cjs");

// Punto de entrada de la API.
require("./src/server.ts");
