export type DbClient = {
  query: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
};

export function createDbClient(_connectionString: string): DbClient {
  throw new Error("DB client not yet configured — implement in E0.8");
}

export const VERSION = "0.0.1";
