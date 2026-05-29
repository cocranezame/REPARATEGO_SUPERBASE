import type { DbClient } from "@kallpasoft/db";
import { clienteDireccion as clienteDireccionTable } from "@kallpasoft/db";
import type { SQL } from "drizzle-orm";
import { and, eq, ne, sql } from "drizzle-orm";
import type { ClienteDireccion } from "../../domain/entities/cliente-direccion.js";
import type {
  CreateClienteDireccionData,
  IClienteDireccionRepository,
  UpdateClienteDireccionData,
} from "../../domain/ports/cliente-direccion.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TxLike {
  execute(query: SQL<unknown>): Promise<unknown>;
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic; structural interface above ensures type safety
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

export class ClienteDireccionDrizzleRepository implements IClienteDireccionRepository {
  constructor(private readonly db: DbClient) {}

  async findById(
    tenantId: string,
    id: string,
    clienteId: string
  ): Promise<ClienteDireccion | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(clienteDireccionTable)
        .where(
          and(
            eq(clienteDireccionTable.id, id),
            eq(clienteDireccionTable.tenant_id, tenantId),
            eq(clienteDireccionTable.cliente_id, clienteId)
          )
        );
    });
    return (rows[0] as ClienteDireccion) ?? null;
  }

  async listByCliente(tenantId: string, clienteId: string): Promise<ClienteDireccion[]> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .select()
        .from(clienteDireccionTable)
        .where(
          and(
            eq(clienteDireccionTable.tenant_id, tenantId),
            eq(clienteDireccionTable.cliente_id, clienteId),
            eq(clienteDireccionTable.activo, true)
          )
        )
        .orderBy(clienteDireccionTable.etiqueta);
    });
    return rows as ClienteDireccion[];
  }

  async create(tenantId: string, data: CreateClienteDireccionData): Promise<ClienteDireccion> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      if (data.es_principal) {
        await tx
          .update(clienteDireccionTable)
          .set({ es_principal: false, updated_at: new Date() })
          .where(
            and(
              eq(clienteDireccionTable.tenant_id, tenantId),
              eq(clienteDireccionTable.cliente_id, data.cliente_id)
            )
          );
      }

      return tx
        .insert(clienteDireccionTable)
        .values({
          tenant_id: tenantId,
          cliente_id: data.cliente_id,
          etiqueta: data.etiqueta,
          direccion: data.direccion,
          distrito: data.distrito ?? null,
          provincia: data.provincia ?? null,
          departamento: data.departamento ?? null,
          referencia: data.referencia ?? null,
          latitud: data.latitud !== undefined ? String(data.latitud) : null,
          longitud: data.longitud !== undefined ? String(data.longitud) : null,
          es_principal: data.es_principal,
        })
        .returning();
    });
    return rows[0] as ClienteDireccion;
  }

  async update(
    tenantId: string,
    id: string,
    clienteId: string,
    data: UpdateClienteDireccionData
  ): Promise<ClienteDireccion | null> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      if (data.es_principal === true) {
        await tx
          .update(clienteDireccionTable)
          .set({ es_principal: false, updated_at: new Date() })
          .where(
            and(
              eq(clienteDireccionTable.tenant_id, tenantId),
              eq(clienteDireccionTable.cliente_id, clienteId),
              ne(clienteDireccionTable.id, id)
            )
          );
      }

      const setValues: Partial<typeof clienteDireccionTable.$inferInsert> = {
        updated_at: new Date(),
      };
      if (data.etiqueta !== undefined) setValues.etiqueta = data.etiqueta;
      if (data.direccion !== undefined) setValues.direccion = data.direccion;
      if (data.distrito !== undefined) setValues.distrito = data.distrito;
      if (data.provincia !== undefined) setValues.provincia = data.provincia;
      if (data.departamento !== undefined) setValues.departamento = data.departamento;
      if (data.referencia !== undefined) setValues.referencia = data.referencia;
      if (data.latitud !== undefined)
        setValues.latitud = data.latitud !== null ? String(data.latitud) : null;
      if (data.longitud !== undefined)
        setValues.longitud = data.longitud !== null ? String(data.longitud) : null;
      if (data.es_principal !== undefined) setValues.es_principal = data.es_principal;
      if (data.activo !== undefined) setValues.activo = data.activo;

      return tx
        .update(clienteDireccionTable)
        .set(setValues)
        .where(
          and(
            eq(clienteDireccionTable.id, id),
            eq(clienteDireccionTable.tenant_id, tenantId),
            eq(clienteDireccionTable.cliente_id, clienteId)
          )
        )
        .returning();
    });
    return (rows[0] as ClienteDireccion) ?? null;
  }

  async softDelete(tenantId: string, id: string, clienteId: string): Promise<boolean> {
    const rows = await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);
      return tx
        .update(clienteDireccionTable)
        .set({ activo: false, updated_at: new Date() })
        .where(
          and(
            eq(clienteDireccionTable.id, id),
            eq(clienteDireccionTable.tenant_id, tenantId),
            eq(clienteDireccionTable.cliente_id, clienteId)
          )
        )
        .returning({ id: clienteDireccionTable.id });
    });
    return rows.length > 0;
  }
}
