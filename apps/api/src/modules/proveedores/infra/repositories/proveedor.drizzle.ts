import type { DbClient } from "@kallpasoft/db";
import {
  condicionPago as condicionPagoTable,
  proveedorContacto as proveedorContactoTable,
  proveedorLinea as proveedorLineaTable,
  proveedorMetodoPago as proveedorMetodoPagoTable,
  proveedor as proveedorTable,
} from "@kallpasoft/db";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import type {
  CondicionPago,
  Proveedor,
  ProveedorContacto,
  ProveedorLinea,
  ProveedorMetodoPago,
} from "../../domain/entities/proveedor.js";
import type {
  CreateCondicionPagoData,
  CreateProveedorContactoData,
  CreateProveedorData,
  CreateProveedorLineaData,
  CreateProveedorMetodoPagoData,
  IProveedorRepository,
  ListProveedoresParams,
  ListProveedoresResult,
  UpdateCondicionPagoData,
  UpdateProveedorContactoData,
  UpdateProveedorData,
  UpdateProveedorMetodoPagoData,
} from "../../domain/ports/proveedor.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class ProveedorDrizzleRepository implements IProveedorRepository {
  constructor(private readonly db: DbClient) {}

  // ─── Condición de pago ──────────────────────────────────────────────────────

  async listCondicionesPago(tenantId: string): Promise<CondicionPago[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(condicionPagoTable)
        .where(and(eq(condicionPagoTable.tenant_id, tenantId), eq(condicionPagoTable.activo, true)))
        .orderBy(condicionPagoTable.dias_credito);
    });
    return rows as CondicionPago[];
  }

  async createCondicionPago(
    tenantId: string,
    data: CreateCondicionPagoData
  ): Promise<CondicionPago> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(condicionPagoTable)
        .values({
          tenant_id: tenantId,
          nombre: data.nombre,
          dias_credito: data.dias_credito ?? 0,
          es_default: data.es_default ?? false,
        })
        .returning();
    });
    return rows[0] as CondicionPago;
  }

  async updateCondicionPago(
    tenantId: string,
    id: string,
    data: UpdateCondicionPagoData
  ): Promise<CondicionPago | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof condicionPagoTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.dias_credito !== undefined) setValues.dias_credito = data.dias_credito;
      if (data.es_default !== undefined) setValues.es_default = data.es_default;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(condicionPagoTable)
        .set(setValues)
        .where(and(eq(condicionPagoTable.id, id), eq(condicionPagoTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as CondicionPago) ?? null;
  }

  async deleteCondicionPago(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(condicionPagoTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(condicionPagoTable.id, id), eq(condicionPagoTable.tenant_id, tenantId)))
        .returning({ id: condicionPagoTable.id });
    });
    return rows.length > 0;
  }

  // ─── Proveedor ──────────────────────────────────────────────────────────────

  async findById(tenantId: string, id: string): Promise<Proveedor | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select()
        .from(proveedorTable)
        .where(and(eq(proveedorTable.id, id), eq(proveedorTable.tenant_id, tenantId)));

      if (!rows[0]) return null;

      const [contactos, metodosPago, lineas] = await Promise.all([
        tx
          .select()
          .from(proveedorContactoTable)
          .where(
            and(
              eq(proveedorContactoTable.proveedor_id, id),
              eq(proveedorContactoTable.tenant_id, tenantId),
              eq(proveedorContactoTable.activo, true)
            )
          )
          .orderBy(proveedorContactoTable.nombre),
        tx
          .select()
          .from(proveedorMetodoPagoTable)
          .where(
            and(
              eq(proveedorMetodoPagoTable.proveedor_id, id),
              eq(proveedorMetodoPagoTable.tenant_id, tenantId),
              eq(proveedorMetodoPagoTable.activo, true)
            )
          )
          .orderBy(proveedorMetodoPagoTable.tipo),
        tx
          .select()
          .from(proveedorLineaTable)
          .where(
            and(
              eq(proveedorLineaTable.proveedor_id, id),
              eq(proveedorLineaTable.tenant_id, tenantId)
            )
          )
          .orderBy(proveedorLineaTable.created_at),
      ]);

      return {
        ...(rows[0] as Proveedor),
        contactos: contactos as ProveedorContacto[],
        metodos_pago: metodosPago as ProveedorMetodoPago[],
        lineas: lineas as ProveedorLinea[],
      };
    });
  }

  async list(tenantId: string, params: ListProveedoresParams): Promise<ListProveedoresResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(proveedorTable.tenant_id, tenantId)];

      if (params.activo !== undefined) {
        conditions.push(eq(proveedorTable.activo, params.activo));
      }

      if (params.search) {
        const term = `%${params.search}%`;
        const searchCond = or(
          ilike(proveedorTable.ruc, term),
          ilike(proveedorTable.razon_social, term),
          ilike(proveedorTable.nombre_comercial, term)
        );
        if (searchCond) conditions.push(searchCond);
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(proveedorTable).where(where),
        tx
          .select()
          .from(proveedorTable)
          .where(where)
          .orderBy(proveedorTable.razon_social)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Proveedor[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateProveedorData): Promise<Proveedor> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(proveedorTable)
        .values({
          tenant_id: tenantId,
          ruc: data.ruc,
          razon_social: data.razon_social,
          nombre_comercial: data.nombre_comercial ?? null,
          contacto_nombre: data.contacto_nombre ?? null,
          telefono: data.telefono ?? null,
          telefono2: data.telefono2 ?? null,
          telefono3: data.telefono3 ?? null,
          email: data.email ?? null,
          direccion: data.direccion ?? null,
          departamento: data.departamento ?? null,
          distrito: data.distrito ?? null,
          condicion_pago_id: data.condicion_pago_id ?? null,
          web: data.web ?? null,
          notas: data.notas ?? null,
          observaciones: data.observaciones ?? null,
          calificacion: data.calificacion ?? null,
        })
        .returning();
    });
    return rows[0] as Proveedor;
  }

  async update(tenantId: string, id: string, data: UpdateProveedorData): Promise<Proveedor | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof proveedorTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.ruc !== undefined) setValues.ruc = data.ruc;
      if (data.razon_social !== undefined) setValues.razon_social = data.razon_social;
      if (data.nombre_comercial !== undefined) setValues.nombre_comercial = data.nombre_comercial;
      if (data.contacto_nombre !== undefined) setValues.contacto_nombre = data.contacto_nombre;
      if (data.telefono !== undefined) setValues.telefono = data.telefono;
      if (data.telefono2 !== undefined) setValues.telefono2 = data.telefono2;
      if (data.telefono3 !== undefined) setValues.telefono3 = data.telefono3;
      if (data.email !== undefined) setValues.email = data.email;
      if (data.direccion !== undefined) setValues.direccion = data.direccion;
      if (data.departamento !== undefined) setValues.departamento = data.departamento;
      if (data.distrito !== undefined) setValues.distrito = data.distrito;
      if (data.condicion_pago_id !== undefined)
        setValues.condicion_pago_id = data.condicion_pago_id;
      if (data.web !== undefined) setValues.web = data.web;
      if (data.notas !== undefined) setValues.notas = data.notas;
      if (data.observaciones !== undefined) setValues.observaciones = data.observaciones;
      if (data.calificacion !== undefined) setValues.calificacion = data.calificacion;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(proveedorTable)
        .set(setValues)
        .where(and(eq(proveedorTable.id, id), eq(proveedorTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Proveedor) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(proveedorTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(proveedorTable.id, id), eq(proveedorTable.tenant_id, tenantId)))
        .returning({ id: proveedorTable.id });
    });
    return rows.length > 0;
  }

  // ─── Contactos ──────────────────────────────────────────────────────────────

  async listContactos(tenantId: string, proveedorId: string): Promise<ProveedorContacto[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(proveedorContactoTable)
        .where(
          and(
            eq(proveedorContactoTable.proveedor_id, proveedorId),
            eq(proveedorContactoTable.tenant_id, tenantId)
          )
        )
        .orderBy(proveedorContactoTable.nombre);
    });
    return rows as ProveedorContacto[];
  }

  async createContacto(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorContactoData
  ): Promise<ProveedorContacto> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      if (data.es_principal) {
        await tx
          .update(proveedorContactoTable)
          .set({ es_principal: false, updated_at: new Date() })
          .where(
            and(
              eq(proveedorContactoTable.proveedor_id, proveedorId),
              eq(proveedorContactoTable.tenant_id, tenantId),
              eq(proveedorContactoTable.es_principal, true)
            )
          );
      }

      return tx
        .insert(proveedorContactoTable)
        .values({
          tenant_id: tenantId,
          proveedor_id: proveedorId,
          nombre: data.nombre,
          cargo: data.cargo ?? null,
          telefono: data.telefono ?? null,
          email: data.email ?? null,
          es_principal: data.es_principal,
        })
        .returning();
    });
    return rows[0] as ProveedorContacto;
  }

  async updateContacto(
    tenantId: string,
    id: string,
    proveedorId: string,
    data: UpdateProveedorContactoData
  ): Promise<ProveedorContacto | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      if (data.es_principal === true) {
        await tx
          .update(proveedorContactoTable)
          .set({ es_principal: false, updated_at: new Date() })
          .where(
            and(
              eq(proveedorContactoTable.proveedor_id, proveedorId),
              eq(proveedorContactoTable.tenant_id, tenantId),
              eq(proveedorContactoTable.es_principal, true)
            )
          );
      }

      const setValues: Partial<typeof proveedorContactoTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.nombre !== undefined) setValues.nombre = data.nombre;
      if (data.cargo !== undefined) setValues.cargo = data.cargo;
      if (data.telefono !== undefined) setValues.telefono = data.telefono;
      if (data.email !== undefined) setValues.email = data.email;
      if (data.es_principal !== undefined) setValues.es_principal = data.es_principal;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(proveedorContactoTable)
        .set(setValues)
        .where(
          and(
            eq(proveedorContactoTable.id, id),
            eq(proveedorContactoTable.proveedor_id, proveedorId),
            eq(proveedorContactoTable.tenant_id, tenantId)
          )
        )
        .returning();
    });
    return (rows[0] as ProveedorContacto) ?? null;
  }

  async deleteContacto(tenantId: string, id: string, proveedorId: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .delete(proveedorContactoTable)
        .where(
          and(
            eq(proveedorContactoTable.id, id),
            eq(proveedorContactoTable.proveedor_id, proveedorId),
            eq(proveedorContactoTable.tenant_id, tenantId)
          )
        )
        .returning({ id: proveedorContactoTable.id });
    });
    return rows.length > 0;
  }

  // ─── Métodos de pago ────────────────────────────────────────────────────────

  async listMetodosPago(tenantId: string, proveedorId: string): Promise<ProveedorMetodoPago[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(proveedorMetodoPagoTable)
        .where(
          and(
            eq(proveedorMetodoPagoTable.proveedor_id, proveedorId),
            eq(proveedorMetodoPagoTable.tenant_id, tenantId)
          )
        )
        .orderBy(proveedorMetodoPagoTable.tipo);
    });
    return rows as ProveedorMetodoPago[];
  }

  async createMetodoPago(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorMetodoPagoData
  ): Promise<ProveedorMetodoPago> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(proveedorMetodoPagoTable)
        .values({
          tenant_id: tenantId,
          proveedor_id: proveedorId,
          tipo_cuenta: data.tipo_cuenta ?? null,
          tipo: data.tipo,
          banco: data.banco ?? null,
          numero_cuenta: data.numero_cuenta ?? null,
          cci: data.cci ?? null,
          titular: data.titular ?? null,
        })
        .returning();
    });
    return rows[0] as ProveedorMetodoPago;
  }

  async updateMetodoPago(
    tenantId: string,
    id: string,
    proveedorId: string,
    data: UpdateProveedorMetodoPagoData
  ): Promise<ProveedorMetodoPago | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof proveedorMetodoPagoTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.tipo_cuenta !== undefined) setValues.tipo_cuenta = data.tipo_cuenta;
      if (data.tipo !== undefined) setValues.tipo = data.tipo;
      if (data.banco !== undefined) setValues.banco = data.banco;
      if (data.numero_cuenta !== undefined) setValues.numero_cuenta = data.numero_cuenta;
      if (data.cci !== undefined) setValues.cci = data.cci;
      if (data.titular !== undefined) setValues.titular = data.titular;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(proveedorMetodoPagoTable)
        .set(setValues)
        .where(
          and(
            eq(proveedorMetodoPagoTable.id, id),
            eq(proveedorMetodoPagoTable.proveedor_id, proveedorId),
            eq(proveedorMetodoPagoTable.tenant_id, tenantId)
          )
        )
        .returning();
    });
    return (rows[0] as ProveedorMetodoPago) ?? null;
  }

  async deleteMetodoPago(tenantId: string, id: string, proveedorId: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .delete(proveedorMetodoPagoTable)
        .where(
          and(
            eq(proveedorMetodoPagoTable.id, id),
            eq(proveedorMetodoPagoTable.proveedor_id, proveedorId),
            eq(proveedorMetodoPagoTable.tenant_id, tenantId)
          )
        )
        .returning({ id: proveedorMetodoPagoTable.id });
    });
    return rows.length > 0;
  }

  // ─── Líneas ─────────────────────────────────────────────────────────────────

  async listLineas(tenantId: string, proveedorId: string): Promise<ProveedorLinea[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(proveedorLineaTable)
        .where(
          and(
            eq(proveedorLineaTable.proveedor_id, proveedorId),
            eq(proveedorLineaTable.tenant_id, tenantId)
          )
        )
        .orderBy(proveedorLineaTable.created_at);
    });
    return rows as ProveedorLinea[];
  }

  async createLinea(
    tenantId: string,
    proveedorId: string,
    data: CreateProveedorLineaData
  ): Promise<ProveedorLinea> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(proveedorLineaTable)
        .values({
          tenant_id: tenantId,
          proveedor_id: proveedorId,
          categoria_id: data.categoria_id ?? null,
          componente_id: data.componente_id ?? null,
          descripcion: data.descripcion ?? null,
        })
        .returning();
    });
    return rows[0] as ProveedorLinea;
  }

  async deleteLinea(tenantId: string, id: string, proveedorId: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .delete(proveedorLineaTable)
        .where(
          and(
            eq(proveedorLineaTable.id, id),
            eq(proveedorLineaTable.proveedor_id, proveedorId),
            eq(proveedorLineaTable.tenant_id, tenantId)
          )
        )
        .returning({ id: proveedorLineaTable.id });
    });
    return rows.length > 0;
  }
}
