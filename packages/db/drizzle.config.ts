import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// CWD cuando drizzle-kit corre desde packages/db → ../../.env es la raíz del monorepo
config({ path: "../../.env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
