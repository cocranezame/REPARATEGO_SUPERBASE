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

export async function pingDb(connectionString: string): Promise<void> {
  const pg = postgres(connectionString, { max: 1 });
  try {
    await pg`SELECT 1`;
  } finally {
    await pg.end();
  }
}

export async function pingDbFromEnv(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  await pingDb(url);
}
