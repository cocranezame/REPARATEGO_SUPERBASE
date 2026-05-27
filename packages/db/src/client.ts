import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type DbClient = ReturnType<typeof createDbClient>;

export function createDbClient(connectionString: string) {
  const sql = postgres(connectionString);
  return drizzle(sql, { schema });
}

export function createDbClientFromEnv(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  return createDbClient(url);
}
