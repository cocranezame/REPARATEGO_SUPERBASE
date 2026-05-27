export type ID = string;

export type BaseEntity = {
  id: ID;
  tenant_id: ID;
  created_at: Date;
  updated_at: Date;
  activo: boolean;
};

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
};

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};
