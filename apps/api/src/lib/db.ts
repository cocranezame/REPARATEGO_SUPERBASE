import { createDbClientFromEnv, type DbClient } from "@kallpasoft/db";

let _db: DbClient | null = null;

export function getDb(): DbClient {
  if (!_db) _db = createDbClientFromEnv();
  return _db;
}
