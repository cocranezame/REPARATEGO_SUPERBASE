import type { DbClient } from "@kallpasoft/db";
import {
  cotizacionCompra as cotizacionCompraTable,
  producto as productoTable,
  proveedorContacto as proveedorContactoTable,
  proveedor as proveedorTable,
} from "@kallpasoft/db";
import { and, count, eq, sql } from "drizzle-orm";
import type { CotizacionCompra } from "../../domain/entities/cotizacion-compra.js";
import type {
  CreateCotizacionCompraData,
  ICotizacionCompraRepository,
  ListCotizacionesParams,
  ListCotizacionesResult,
  UpdateCotizacionCompraData,
} from "../../domain/ports/cotizacion-compra.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class CotizacionCompraDrizzleRepository implements ICotizacionCompraRepository {
  constructor(private readonly db: DbClient) {}

  async list(tenantId: string, params: ListCotizacionesParams): Promise<ListCotizacionesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(cotizacionCompraTable.tenant_id, tenantId)];

      if (params.proveedor_id !== undefined) {
        conditions.push(eq(cotizacionCompraTable.proveedor_id, params.proveedor_id));
      }
      if (params.producto_id !== undefined) {
        conditions.push(eq(cotizacionCompraTable.producto_id, params.producto_id));
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(cotizacionCompraTable).where(where),
        tx
          .select({
            id: cotizacionCompraTable.id,
            tenant_id: cotizacionCompraTable.tenant_id,
            proveedor_id: cotizacionCompraTable.proveedor_id,
            proveedor_nombre: proveedorTable.razon_social,
            producto_id: cotizacionCompraTable.producto_id,
            producto_nombre: productoTable.nombre,
            precio_unitario: cotizacionCompraTable.precio_unitario,
            notas: cotizacionCompraTable.notas,
            created_at: cotizacionCompraTable.created_at,
            updated_at: cotizacionCompraTable.updated_at,
          })
          .from(cotizacionCompraTable)
          .leftJoin(proveedorTable, eq(cotizacionCompraTable.proveedor_id, proveedorTable.id))
          .leftJoin(productoTable, eq(cotizacionCompraTable.producto_id, productoTable.id))
          .where(where)
          .orderBy(cotizacionCompraTable.updated_at)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: rows as CotizacionCompra[], total: countRows[0]?.total ?? 0 };
    });
  }

  async findById(tenantId: string, id: string): Promise<CotizacionCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          id: cotizacionCompraTable.id,
          tenant_id: cotizacionCompraTable.tenant_id,
          proveedor_id: cotizacionCompraTable.proveedor_id,
          proveedor_nombre: proveedorTable.razon_social,
          producto_id: cotizacionCompraTable.producto_id,
          producto_nombre: productoTable.nombre,
          precio_unitario: cotizacionCompraTable.precio_unitario,
          notas: cotizacionCompraTable.notas,
          created_at: cotizacionCompraTable.created_at,
          updated_at: cotizacionCompraTable.updated_at,
        })
        .from(cotizacionCompraTable)
        .leftJoin(proveedorTable, eq(cotizacionCompraTable.proveedor_id, proveedorTable.id))
        .leftJoin(productoTable, eq(cotizacionCompraTable.producto_id, productoTable.id))
        .where(and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId)))
        .limit(1);

      return (rows[0] as CotizacionCompra) ?? null;
    });
  }

  async create(tenantId: string, data: CreateCotizacionCompraData): Promise<CotizacionCompra> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const inserted = await tx
        .insert(cotizacionCompraTable)
        .values({
          tenant_id: tenantId,
          proveedor_id: data.proveedor_id,
          producto_id: data.producto_id,
          ...(data.precio_unitario !== undefined
            ? { precio_unitario: String(data.precio_unitario) }
            : {}),
          ...(data.notas !== undefined ? { notas: data.notas } : {}),
        })
        .returning();

      const row = inserted[0];
      if (!row) throw new Error("Insert did not return a row");

      const full = await tx
        .select({
          id: cotizacionCompraTable.id,
          tenant_id: cotizacionCompraTable.tenant_id,
          proveedor_id: cotizacionCompraTable.proveedor_id,
          proveedor_nombre: proveedorTable.razon_social,
          producto_id: cotizacionCompraTable.producto_id,
          producto_nombre: productoTable.nombre,
          precio_unitario: cotizacionCompraTable.precio_unitario,
          notas: cotizacionCompraTable.notas,
          created_at: cotizacionCompraTable.created_at,
          updated_at: cotizacionCompraTable.updated_at,
        })
        .from(cotizacionCompraTable)
        .leftJoin(proveedorTable, eq(cotizacionCompraTable.proveedor_id, proveedorTable.id))
        .leftJoin(productoTable, eq(cotizacionCompraTable.producto_id, productoTable.id))
        .where(
          and(eq(cotizacionCompraTable.id, row.id), eq(cotizacionCompraTable.tenant_id, tenantId))
        )
        .limit(1);

      return full[0] as CotizacionCompra;
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateCotizacionCompraData
  ): Promise<CotizacionCompra | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Record<string, unknown> = { updated_at: new Date() };
      if (data.precio_unitario !== undefined)
        setValues.precio_unitario = String(data.precio_unitario);
      if (data.notas !== undefined) setValues.notas = data.notas;

      await tx
        .update(cotizacionCompraTable)
        .set(setValues)
        .where(
          and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId))
        );

      return this.findById(tenantId, id);
    });
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .delete(cotizacionCompraTable)
      .where(and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId)))
      .returning({ id: cotizacionCompraTable.id });
    return rows.length > 0;
  }

  async getWhatsapp(tenantId: string, id: string): Promise<{ url: string }> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select({
          producto_nombre: productoTable.nombre,
          proveedor_razon_social: proveedorTable.razon_social,
          proveedor_telefono: proveedorTable.telefono,
          contacto_nombre: proveedorContactoTable.nombre,
          contacto_telefono: proveedorContactoTable.telefono,
        })
        .from(cotizacionCompraTable)
        .innerJoin(productoTable, eq(cotizacionCompraTable.producto_id, productoTable.id))
        .innerJoin(proveedorTable, eq(cotizacionCompraTable.proveedor_id, proveedorTable.id))
        .leftJoin(
          proveedorContactoTable,
          and(
            eq(proveedorContactoTable.proveedor_id, cotizacionCompraTable.proveedor_id),
            eq(proveedorContactoTable.es_principal, true)
          )
        )
        .where(and(eq(cotizacionCompraTable.id, id), eq(cotizacionCompraTable.tenant_id, tenantId)))
        .limit(1);

      const row = rows[0];
      if (!row) throw new Error("Cotización no encontrada");

      const nombreContacto = row.contacto_nombre ?? row.proveedor_razon_social;
      const telefonoRaw = row.contacto_telefono ?? row.proveedor_telefono;

      if (!telefonoRaw) throw new Error("El proveedor no tiene teléfono registrado");

      const numero = telefonoRaw.replace(/\D/g, "");
      const mensaje = `Estimado ${nombreContacto}, quería consultar el precio de ${row.producto_nombre}. ¿Cuál es el costo por unidad?`;
      return { url: `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}` };
    });
  }
}
