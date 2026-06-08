import type { DbClient } from "@kallpasoft/db";
import {
  productoCompatibilidad as productoCompatibilidadTable,
  producto as productoTable,
} from "@kallpasoft/db";
import type { TipoProducto } from "@kallpasoft/shared";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import type { Producto } from "../../domain/entities/producto.js";
import type { ProductoCompatibilidad } from "../../domain/entities/producto-compatibilidad.js";
import type {
  CreateProductoData,
  IProductoRepository,
  ListProductosParams,
  ListProductosResult,
  UpdateProductoData,
} from "../../domain/ports/producto.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

// biome-ignore lint/suspicious/noExplicitAny: raw execute result varies by adapter
async function generateCodigo(tx: any, tenantId: string, tipo: TipoProducto): Promise<string> {
  const prefix = tipo === "PRODUCTO" ? "PRD" : "SRV";
  const likePattern = `${prefix}-%`;
  const res = await tx.execute(
    sql`SELECT MAX(codigo) AS max_codigo FROM producto WHERE tenant_id = ${tenantId}::uuid AND codigo LIKE ${likePattern}`
  );
  // biome-ignore lint/suspicious/noExplicitAny: raw pg QueryResult shape
  const maxCodigo = (res as any).rows?.[0]?.max_codigo as string | null;
  let nextNum = 1;
  if (maxCodigo) {
    const parts = maxCodigo.split("-");
    const num = Number.parseInt(parts[1] ?? "0", 10);
    if (!Number.isNaN(num)) nextNum = num + 1;
  }
  return `${prefix}-${String(nextNum).padStart(4, "0")}`;
}

export class ProductoDrizzleRepository implements IProductoRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Producto | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(productoTable)
        .where(and(eq(productoTable.id, id), eq(productoTable.tenant_id, tenantId)));
    });
    return (rows[0] as Producto) ?? null;
  }

  async list(tenantId: string, params: ListProductosParams): Promise<ListProductosResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(productoTable.tenant_id, tenantId)];

      if (params.tipo !== undefined) {
        conditions.push(
          eq(productoTable.tipo, params.tipo as (typeof productoTable.tipo)["_"]["data"])
        );
      }
      if (params.categoria_id !== undefined) {
        conditions.push(eq(productoTable.categoria_id, params.categoria_id));
      }
      if (params.componente_id !== undefined) {
        conditions.push(eq(productoTable.componente_id, params.componente_id));
      }
      if (params.marca_id !== undefined) {
        conditions.push(eq(productoTable.marca_id, params.marca_id));
      }
      if (params.activo !== undefined) {
        conditions.push(eq(productoTable.activo, params.activo));
      }
      if (params.search) {
        conditions.push(ilike(productoTable.nombre, `%${params.search}%`));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(productoTable).where(where),
        tx
          .select()
          .from(productoTable)
          .where(where)
          .orderBy(productoTable.nombre)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Producto[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateProductoData): Promise<Producto> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      const codigo = await generateCodigo(tx, tenantId, data.tipo);
      return tx
        .insert(productoTable)
        .values({
          tenant_id: tenantId,
          codigo,
          tipo: data.tipo as (typeof productoTable.tipo)["_"]["data"],
          alcance: (data.alcance ?? "GLOBAL") as (typeof productoTable.alcance)["_"]["data"],
          nombre: data.nombre,
          descripcion: data.descripcion ?? null,
          categoria_id: data.categoria_id,
          componente_id: data.componente_id ?? null,
          marca_id: data.marca_id ?? null,
          unidad_medida: data.unidad_medida ?? "UND",
          precio_compra: data.precio_compra !== undefined ? String(data.precio_compra) : null,
          precio_venta: String(data.precio_venta),
          stock_minimo: data.stock_minimo ?? 0,
          imagen_url: data.imagen_url ?? null,
        })
        .returning();
    });
    return rows[0] as Producto;
  }

  async update(tenantId: string, id: string, data: UpdateProductoData): Promise<Producto | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof productoTable.$inferInsert> = { updated_at: new Date() };
      if (data.alcance !== undefined)
        setValues.alcance = data.alcance as (typeof productoTable.alcance)["_"]["data"];
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.descripcion !== undefined) setValues.descripcion = data.descripcion;
      if (data.categoria_id !== undefined) setValues.categoria_id = data.categoria_id;
      if (data.componente_id !== undefined) setValues.componente_id = data.componente_id;
      if (data.marca_id !== undefined) setValues.marca_id = data.marca_id;
      if (data.unidad_medida !== undefined) setValues.unidad_medida = data.unidad_medida;
      if (data.precio_compra !== undefined)
        setValues.precio_compra = data.precio_compra !== null ? String(data.precio_compra) : null;
      if (data.precio_venta !== undefined) setValues.precio_venta = String(data.precio_venta);
      if (data.stock_minimo !== undefined) setValues.stock_minimo = data.stock_minimo;
      if (data.imagen_url !== undefined) setValues.imagen_url = data.imagen_url;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(productoTable)
        .set(setValues)
        .where(and(eq(productoTable.id, id), eq(productoTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Producto) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(productoTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(productoTable.id, id), eq(productoTable.tenant_id, tenantId)))
        .returning({ id: productoTable.id });
    });
    return rows.length > 0;
  }

  async listCompatibilidades(
    tenantId: string,
    productoId: string
  ): Promise<ProductoCompatibilidad[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(productoCompatibilidadTable)
        .where(
          and(
            eq(productoCompatibilidadTable.tenant_id, tenantId),
            eq(productoCompatibilidadTable.producto_id, productoId)
          )
        )
        .orderBy(productoCompatibilidadTable.created_at);
    });
    return rows as ProductoCompatibilidad[];
  }

  async syncCompatibilidades(
    tenantId: string,
    productoId: string,
    modeloIds: string[]
  ): Promise<ProductoCompatibilidad[]> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      await tx
        .delete(productoCompatibilidadTable)
        .where(
          and(
            eq(productoCompatibilidadTable.tenant_id, tenantId),
            eq(productoCompatibilidadTable.producto_id, productoId)
          )
        );

      if (modeloIds.length === 0) return [];

      const inserted = await tx
        .insert(productoCompatibilidadTable)
        .values(
          modeloIds.map((modeloId) => ({
            tenant_id: tenantId,
            producto_id: productoId,
            modelo_id: modeloId,
          }))
        )
        .returning();

      return inserted as ProductoCompatibilidad[];
    });
  }
}
