import type { DbClient } from "@kallpasoft/db";
import { clienteDireccion as clienteDireccionTable, cliente as clienteTable } from "@kallpasoft/db";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import type { Cliente } from "../../domain/entities/cliente.js";
import type { ClienteDireccion } from "../../domain/entities/cliente-direccion.js";
import type {
  CreateClienteData,
  IClienteRepository,
  ListClientesParams,
  ListClientesResult,
  UpdateClienteData,
} from "../../domain/ports/cliente.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class ClienteDrizzleRepository implements IClienteRepository {
  constructor(private readonly db: DbClient) {}

  async findById(tenantId: string, id: string): Promise<Cliente | null> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const rows = await tx
        .select()
        .from(clienteTable)
        .where(and(eq(clienteTable.id, id), eq(clienteTable.tenant_id, tenantId)));

      if (!rows[0]) return null;

      const dirs = await tx
        .select()
        .from(clienteDireccionTable)
        .where(
          and(
            eq(clienteDireccionTable.cliente_id, id),
            eq(clienteDireccionTable.tenant_id, tenantId),
            eq(clienteDireccionTable.activo, true)
          )
        )
        .orderBy(clienteDireccionTable.etiqueta);

      return { ...(rows[0] as Cliente), direcciones: dirs as ClienteDireccion[] };
    });
  }

  async findByDocumento(tenantId: string, tipo: string, numero: string): Promise<Cliente | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(clienteTable)
        .where(
          and(
            eq(clienteTable.tenant_id, tenantId),
            eq(
              clienteTable.tipo_documento,
              tipo as (typeof clienteTable.tipo_documento)["_"]["data"]
            ),
            eq(clienteTable.numero_documento, numero)
          )
        );
    });
    return (rows[0] as Cliente) ?? null;
  }

  async list(tenantId: string, params: ListClientesParams): Promise<ListClientesResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const conditions = [eq(clienteTable.tenant_id, tenantId)];

      if (params.activo !== undefined) {
        conditions.push(eq(clienteTable.activo, params.activo));
      }

      if (params.tipo_documento !== undefined) {
        conditions.push(
          eq(
            clienteTable.tipo_documento,
            params.tipo_documento as (typeof clienteTable.tipo_documento)["_"]["data"]
          )
        );
      }

      if (params.tipo_persona !== undefined) {
        conditions.push(eq(clienteTable.tipo_persona, params.tipo_persona));
      }

      if (params.search) {
        const term = `%${params.search}%`;
        const searchCondition = or(
          ilike(clienteTable.numero_documento, term),
          ilike(clienteTable.nombres, term),
          ilike(clienteTable.apellidos, term),
          ilike(clienteTable.razon_social, term),
          ilike(clienteTable.telefono, term)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      const where = and(...conditions);
      const offset = (params.page - 1) * params.pageSize;

      const [countRows, items] = await Promise.all([
        tx.select({ total: count() }).from(clienteTable).where(where),
        tx
          .select()
          .from(clienteTable)
          .where(where)
          .orderBy(clienteTable.apellidos, clienteTable.nombres, clienteTable.razon_social)
          .limit(params.pageSize)
          .offset(offset),
      ]);

      return { items: items as Cliente[], total: countRows[0]?.total ?? 0 };
    });
  }

  async create(tenantId: string, data: CreateClienteData): Promise<Cliente> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .insert(clienteTable)
        .values({
          tenant_id: tenantId,
          tipo_documento: data.tipo_documento as (typeof clienteTable.tipo_documento)["_"]["data"],
          numero_documento: data.numero_documento,
          tipo_persona: data.tipo_persona,
          nombres: data.nombres ?? null,
          apellidos: data.apellidos ?? null,
          razon_social: data.razon_social ?? null,
          email: data.email ?? null,
          telefono: data.telefono ?? null,
          telefono_secundario: data.telefono_secundario ?? null,
          notas: data.notas ?? null,
          distrito: data.distrito ?? null,
          nivel: (data.nivel ?? "NORMAL") as (typeof clienteTable.nivel)["_"]["data"],
        })
        .returning();
    });
    return rows[0] as Cliente;
  }

  async update(tenantId: string, id: string, data: UpdateClienteData): Promise<Cliente | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const setValues: Partial<typeof clienteTable.$inferInsert> = { updated_at: new Date() };
      if (data.tipo_documento !== undefined)
        setValues.tipo_documento =
          data.tipo_documento as (typeof clienteTable.tipo_documento)["_"]["data"];
      if (data.numero_documento !== undefined) setValues.numero_documento = data.numero_documento;
      if (data.tipo_persona !== undefined) setValues.tipo_persona = data.tipo_persona;
      if (data.nombres !== undefined) setValues.nombres = data.nombres;
      if (data.apellidos !== undefined) setValues.apellidos = data.apellidos;
      if (data.razon_social !== undefined) setValues.razon_social = data.razon_social;
      if (data.email !== undefined) setValues.email = data.email;
      if (data.telefono !== undefined) setValues.telefono = data.telefono;
      if (data.telefono_secundario !== undefined)
        setValues.telefono_secundario = data.telefono_secundario;
      if (data.notas !== undefined) setValues.notas = data.notas;
      if (data.distrito !== undefined) setValues.distrito = data.distrito;
      if (data.nivel !== undefined)
        setValues.nivel = data.nivel as (typeof clienteTable.nivel)["_"]["data"];
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(clienteTable)
        .set(setValues)
        .where(and(eq(clienteTable.id, id), eq(clienteTable.tenant_id, tenantId)))
        .returning();
    });
    return (rows[0] as Cliente) ?? null;
  }

  async softDelete(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(clienteTable)
        .set({ activo: false, updated_at: new Date() })
        .where(and(eq(clienteTable.id, id), eq(clienteTable.tenant_id, tenantId)))
        .returning({ id: clienteTable.id });
    });
    return rows.length > 0;
  }
}
