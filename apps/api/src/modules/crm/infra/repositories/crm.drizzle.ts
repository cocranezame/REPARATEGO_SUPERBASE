import type { DbClient } from "@kallpasoft/db";
import {
  crmConversacion as crmConversacionTable,
  crmEtapa as crmEtapaTable,
  crmEtapaTransicion as crmEtapaTransicionTable,
  crmEtiqueta as crmEtiquetaTable,
  crmEvento as crmEventoTable,
  crmLeadEtiqueta as crmLeadEtiquetaTable,
  crmLead as crmLeadTable,
  crmMensaje as crmMensajeTable,
  crmNota as crmNotaTable,
  usuario as usuarioTable,
  waCuenta as waCuentaTable,
} from "@kallpasoft/db";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type {
  CrmConversacion,
  CrmEtapa,
  CrmEtapaTransicion,
  CrmEtiqueta,
  CrmLead,
  CrmMensaje,
  CrmNota,
  WaCuenta,
} from "../../domain/entities/crm.js";
import type {
  CreateEtapaData,
  CreateEtiquetaData,
  CreateWaCuentaData,
  GuardarMensajeData,
  ICrmRepository,
  ListConversacionesParams,
  ListLeadsParams,
  ListMensajesParams,
  UpdateEtapaData,
  UpdateEtiquetaData,
  UpdateWaCuentaData,
} from "../../domain/ports/crm.repository.js";

function getEncryptionKey(): string {
  const key = process.env.CRM_ENCRYPTION_KEY;
  if (!key) throw new Error("CRM_ENCRYPTION_KEY no configurado");
  return key;
}

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
}

export class CrmDrizzleRepository implements ICrmRepository {
  constructor(private readonly db: DbClient) {}

  // ─── WA Cuentas ────────────────────────────────────────────────────────────

  async listWaCuentas(tenantId: string): Promise<WaCuenta[]> {
    const rows = await this.db.execute(sql`
      SELECT id, tenant_id, negocio_nombre, phone_number_id, waba_id,
             webhook_verify_token, nombre, activo, created_at, updated_at
      FROM wa_cuenta
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY created_at ASC
    `);
    return rows as unknown as WaCuenta[];
  }

  async createWaCuenta(
    tenantId: string,
    data: CreateWaCuentaData,
    userId: string
  ): Promise<WaCuenta> {
    const key = getEncryptionKey();
    const rows = await this.db.execute(sql`
      INSERT INTO wa_cuenta (id, tenant_id, negocio_nombre, phone_number_id, waba_id,
        access_token_encrypted, webhook_verify_token, nombre, created_by)
      VALUES (gen_random_uuid(), ${tenantId}::uuid, ${data.negocio_nombre},
        ${data.phone_number_id}, ${data.waba_id},
        pgp_sym_encrypt(${data.access_token}, ${key}),
        ${data.webhook_verify_token}, ${data.nombre ?? null}, ${userId}::uuid)
      RETURNING id, tenant_id, negocio_nombre, phone_number_id, waba_id,
        webhook_verify_token, nombre, activo, created_at, updated_at
    `);
    return rows[0] as unknown as WaCuenta;
  }

  async updateWaCuenta(
    tenantId: string,
    id: string,
    data: UpdateWaCuentaData
  ): Promise<WaCuenta | null> {
    const key = getEncryptionKey();

    if (data.access_token !== undefined) {
      const rows = await this.db.execute(sql`
        UPDATE wa_cuenta
        SET access_token_encrypted = pgp_sym_encrypt(${data.access_token}, ${key}),
            updated_at = now()
            ${data.negocio_nombre !== undefined ? sql`, negocio_nombre = ${data.negocio_nombre}` : sql``}
            ${data.webhook_verify_token !== undefined ? sql`, webhook_verify_token = ${data.webhook_verify_token}` : sql``}
            ${data.nombre !== undefined ? sql`, nombre = ${data.nombre}` : sql``}
            ${data.activo !== undefined ? sql`, activo = ${data.activo}` : sql``}
        WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid
        RETURNING id, tenant_id, negocio_nombre, phone_number_id, waba_id,
          webhook_verify_token, nombre, activo, created_at, updated_at
      `);
      if (!rows[0]) return null;
      return rows[0] as unknown as WaCuenta;
    }

    const rows = await this.db.execute(sql`
      UPDATE wa_cuenta
      SET updated_at = now()
          ${data.negocio_nombre !== undefined ? sql`, negocio_nombre = ${data.negocio_nombre}` : sql``}
          ${data.webhook_verify_token !== undefined ? sql`, webhook_verify_token = ${data.webhook_verify_token}` : sql``}
          ${data.nombre !== undefined ? sql`, nombre = ${data.nombre}` : sql``}
          ${data.activo !== undefined ? sql`, activo = ${data.activo}` : sql``}
      WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid
      RETURNING id, tenant_id, negocio_nombre, phone_number_id, waba_id,
        webhook_verify_token, nombre, activo, created_at, updated_at
    `);
    if (!rows[0]) return null;
    return rows[0] as unknown as WaCuenta;
  }

  async deleteWaCuenta(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(waCuentaTable)
      .set({ activo: false })
      .where(and(eq(waCuentaTable.id, id), eq(waCuentaTable.tenant_id, tenantId)))
      .returning({ id: waCuentaTable.id });
    return rows.length > 0;
  }

  async getWaCuentaWithToken(
    tenantId: string,
    id: string
  ): Promise<{ phone_number_id: string; access_token: string } | null> {
    const key = getEncryptionKey();
    const rows = await this.db.execute(sql`
      SELECT phone_number_id,
             pgp_sym_decrypt(access_token_encrypted, ${key})::text AS access_token
      FROM wa_cuenta
      WHERE id = ${id}::uuid AND tenant_id = ${tenantId}::uuid AND activo = true
    `);
    if (!rows[0]) return null;
    return rows[0] as unknown as { phone_number_id: string; access_token: string };
  }

  // ─── Etapas ────────────────────────────────────────────────────────────────

  async listEtapas(tenantId: string): Promise<CrmEtapa[]> {
    const rows = await this.db.execute(sql`
      SELECT
        e.id, e.tenant_id, e.nombre, e.codigo, e.orden, e.objetivo, e.operador, e.bot_id,
        e.tiempo_espera_horas, e.max_intentos_recordatorio, e.color, e.activo,
        e.created_at, e.updated_at,
        b.nombre AS bot_nombre,
        COALESCE((
          SELECT COUNT(*)::int FROM crm_lead l
          WHERE l.etapa_id = e.id AND l.tenant_id = e.tenant_id AND l.activo = true
        ), 0) AS leads_count
      FROM crm_etapa e
      LEFT JOIN crm_bot b ON e.bot_id = b.id
      WHERE e.tenant_id = ${tenantId}::uuid AND e.activo = true
      ORDER BY e.orden ASC
    `);
    return rows as unknown as CrmEtapa[];
  }

  async createEtapa(tenantId: string, data: CreateEtapaData): Promise<CrmEtapa> {
    const [inserted] = await this.db
      .insert(crmEtapaTable)
      .values({
        tenant_id: tenantId,
        nombre: data.nombre,
        codigo: data.codigo,
        orden: data.orden,
        ...(data.objetivo !== undefined ? { objetivo: data.objetivo } : {}),
        operador: data.operador as "IA" | "BOT" | "HUMANO" | "SISTEMA",
        ...(data.bot_id !== undefined ? { bot_id: data.bot_id } : {}),
        ...(data.tiempo_espera_horas !== undefined
          ? { tiempo_espera_horas: data.tiempo_espera_horas }
          : {}),
        ...(data.max_intentos_recordatorio !== undefined
          ? { max_intentos_recordatorio: data.max_intentos_recordatorio }
          : {}),
        ...(data.color !== undefined ? { color: data.color } : {}),
      })
      .returning();

    if (!inserted) throw new Error("Error al crear etapa");
    const etapas = await this.listEtapas(tenantId);
    return etapas.find((e) => e.id === inserted.id) ?? (inserted as unknown as CrmEtapa);
  }

  async updateEtapa(tenantId: string, id: string, data: UpdateEtapaData): Promise<CrmEtapa | null> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.orden !== undefined) updateData.orden = data.orden;
    if (data.objetivo !== undefined) updateData.objetivo = data.objetivo;
    if (data.operador !== undefined) updateData.operador = data.operador;
    if (data.bot_id !== undefined) updateData.bot_id = data.bot_id;
    if (data.tiempo_espera_horas !== undefined)
      updateData.tiempo_espera_horas = data.tiempo_espera_horas;
    if (data.max_intentos_recordatorio !== undefined)
      updateData.max_intentos_recordatorio = data.max_intentos_recordatorio;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const rows = await this.db
      .update(crmEtapaTable)
      .set(updateData)
      .where(and(eq(crmEtapaTable.id, id), eq(crmEtapaTable.tenant_id, tenantId)))
      .returning({ id: crmEtapaTable.id });

    if (rows.length === 0) return null;

    const etapas = await this.listEtapas(tenantId);
    return etapas.find((e) => e.id === id) ?? null;
  }

  async deleteEtapa(tenantId: string, id: string): Promise<boolean> {
    const leadsRows = await this.db
      .select({ n: count() })
      .from(crmLeadTable)
      .where(
        and(
          eq(crmLeadTable.etapa_id, id),
          eq(crmLeadTable.tenant_id, tenantId),
          eq(crmLeadTable.activo, true)
        )
      );

    const leadsCount = Number(leadsRows[0]?.n ?? 0);
    if (leadsCount > 0) throw new Error("ETAPA_HAS_LEADS");

    const rows = await this.db
      .update(crmEtapaTable)
      .set({ activo: false })
      .where(and(eq(crmEtapaTable.id, id), eq(crmEtapaTable.tenant_id, tenantId)))
      .returning({ id: crmEtapaTable.id });

    return rows.length > 0;
  }

  // ─── Transiciones ──────────────────────────────────────────────────────────

  async listTransiciones(tenantId: string, etapaOrigenId: string): Promise<CrmEtapaTransicion[]> {
    const rows = await this.db.execute(sql`
      SELECT t.id, t.tenant_id, t.etapa_origen_id, t.etapa_destino_id, t.created_at,
             d.nombre AS destino_nombre, d.codigo AS destino_codigo
      FROM crm_etapa_transicion t
      JOIN crm_etapa d ON t.etapa_destino_id = d.id
      WHERE t.tenant_id = ${tenantId}::uuid AND t.etapa_origen_id = ${etapaOrigenId}::uuid
      ORDER BY d.orden ASC
    `);
    return rows as unknown as CrmEtapaTransicion[];
  }

  async createTransicion(
    tenantId: string,
    etapaOrigenId: string,
    etapaDestinoId: string
  ): Promise<CrmEtapaTransicion> {
    await this.db.insert(crmEtapaTransicionTable).values({
      tenant_id: tenantId,
      etapa_origen_id: etapaOrigenId,
      etapa_destino_id: etapaDestinoId,
    });

    const rows = await this.listTransiciones(tenantId, etapaOrigenId);
    const found = rows.find((r) => r.etapa_destino_id === etapaDestinoId);
    if (!found) throw new Error("Error al crear transición");
    return found;
  }

  async deleteTransicion(
    tenantId: string,
    etapaOrigenId: string,
    etapaDestinoId: string
  ): Promise<boolean> {
    const rows = await this.db
      .delete(crmEtapaTransicionTable)
      .where(
        and(
          eq(crmEtapaTransicionTable.tenant_id, tenantId),
          eq(crmEtapaTransicionTable.etapa_origen_id, etapaOrigenId),
          eq(crmEtapaTransicionTable.etapa_destino_id, etapaDestinoId)
        )
      )
      .returning({ id: crmEtapaTransicionTable.id });
    return rows.length > 0;
  }

  // ─── Etiquetas ─────────────────────────────────────────────────────────────

  async listEtiquetas(tenantId: string): Promise<CrmEtiqueta[]> {
    return this.db
      .select()
      .from(crmEtiquetaTable)
      .where(eq(crmEtiquetaTable.tenant_id, tenantId))
      .orderBy(asc(crmEtiquetaTable.grupo), asc(crmEtiquetaTable.nombre)) as unknown as Promise<
      CrmEtiqueta[]
    >;
  }

  async createEtiqueta(tenantId: string, data: CreateEtiquetaData): Promise<CrmEtiqueta> {
    const [row] = await this.db
      .insert(crmEtiquetaTable)
      .values({
        tenant_id: tenantId,
        nombre: data.nombre,
        codigo: data.codigo,
        grupo: data.grupo as
          | "IDENTIFICACION"
          | "RUTA_ACTIVA"
          | "CAPTURA_DATOS"
          | "ESTADO_OPERATIVO",
        ...(data.descripcion !== undefined ? { descripcion: data.descripcion } : {}),
      })
      .returning();
    return row as unknown as CrmEtiqueta;
  }

  async updateEtiqueta(
    tenantId: string,
    id: string,
    data: UpdateEtiquetaData
  ): Promise<CrmEtiqueta | null> {
    const updateData: Record<string, unknown> = {};
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.grupo !== undefined) updateData.grupo = data.grupo;
    if (data.descripcion !== undefined) updateData.descripcion = data.descripcion;
    if (data.activo !== undefined) updateData.activo = data.activo;

    const rows = await this.db
      .update(crmEtiquetaTable)
      .set(updateData)
      .where(and(eq(crmEtiquetaTable.id, id), eq(crmEtiquetaTable.tenant_id, tenantId)))
      .returning();

    if (rows.length === 0) return null;
    return rows[0] as unknown as CrmEtiqueta;
  }

  async deleteEtiqueta(tenantId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .update(crmEtiquetaTable)
      .set({ activo: false })
      .where(and(eq(crmEtiquetaTable.id, id), eq(crmEtiquetaTable.tenant_id, tenantId)))
      .returning({ id: crmEtiquetaTable.id });
    return rows.length > 0;
  }

  // ─── Leads ─────────────────────────────────────────────────────────────────

  private buildLeadFromRow(row: Record<string, unknown>): CrmLead {
    return {
      id: row.id as string,
      tenant_id: row.tenant_id as string,
      wa_cuenta_id: row.wa_cuenta_id as string,
      celular: row.celular as string,
      nombre: (row.nombre as string | null) ?? null,
      equipo_descripcion: (row.equipo_descripcion as string | null) ?? null,
      falla_descripcion: (row.falla_descripcion as string | null) ?? null,
      ubicacion: (row.ubicacion as string | null) ?? null,
      etapa_id: row.etapa_id as string,
      etapa_nombre: (row.etapa_nombre as string | null) ?? null,
      etapa_codigo: (row.etapa_codigo as string | null) ?? null,
      vendedor_id: (row.vendedor_id as string | null) ?? null,
      vendedor_nombre: (row.vendedor_nombre as string | null) ?? null,
      cliente_id: (row.cliente_id as string | null) ?? null,
      sucursal_id: (row.sucursal_id as string | null) ?? null,
      utm_source: (row.utm_source as string | null) ?? null,
      utm_campaign: (row.utm_campaign as string | null) ?? null,
      utm_medium: (row.utm_medium as string | null) ?? null,
      activo: row.activo as boolean,
      etiquetas: [],
      ultimo_mensaje: null,
      notas: [],
      eventos: [],
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  async listLeads(
    tenantId: string,
    params: ListLeadsParams
  ): Promise<{ items: CrmLead[]; total: number }> {
    const conds = [eq(crmLeadTable.tenant_id, tenantId)];
    if (params.etapa_id) conds.push(eq(crmLeadTable.etapa_id, params.etapa_id));
    if (params.vendedor_id) conds.push(eq(crmLeadTable.vendedor_id, params.vendedor_id));
    if (params.cliente_id) conds.push(eq(crmLeadTable.cliente_id, params.cliente_id));
    if (params.sucursal_id) conds.push(eq(crmLeadTable.sucursal_id, params.sucursal_id));
    if (params.utm_source) conds.push(eq(crmLeadTable.utm_source, params.utm_source));
    if (params.utm_campaign) conds.push(eq(crmLeadTable.utm_campaign, params.utm_campaign));
    if (params.utm_medium) conds.push(eq(crmLeadTable.utm_medium, params.utm_medium));
    if (params.activo !== undefined) conds.push(eq(crmLeadTable.activo, params.activo));
    if (params.desde) conds.push(gte(crmLeadTable.created_at, new Date(params.desde)));
    if (params.hasta) conds.push(lte(crmLeadTable.created_at, new Date(params.hasta)));
    if (params.search) {
      conds.push(
        or(
          ilike(crmLeadTable.nombre, `%${params.search}%`),
          ilike(crmLeadTable.celular, `%${params.search}%`)
        )
      );
    }

    const whereClause = and(...conds);
    const offset = (params.page - 1) * params.pageSize;

    const rows = await this.db
      .select({
        id: crmLeadTable.id,
        tenant_id: crmLeadTable.tenant_id,
        wa_cuenta_id: crmLeadTable.wa_cuenta_id,
        celular: crmLeadTable.celular,
        nombre: crmLeadTable.nombre,
        equipo_descripcion: crmLeadTable.equipo_descripcion,
        falla_descripcion: crmLeadTable.falla_descripcion,
        ubicacion: crmLeadTable.ubicacion,
        etapa_id: crmLeadTable.etapa_id,
        etapa_nombre: crmEtapaTable.nombre,
        etapa_codigo: crmEtapaTable.codigo,
        vendedor_id: crmLeadTable.vendedor_id,
        vendedor_nombre: sql<
          string | null
        >`CASE WHEN ${usuarioTable.id} IS NOT NULL THEN ${usuarioTable.nombres} || ' ' || ${usuarioTable.apellidos} ELSE NULL END`,
        cliente_id: crmLeadTable.cliente_id,
        sucursal_id: crmLeadTable.sucursal_id,
        utm_source: crmLeadTable.utm_source,
        utm_campaign: crmLeadTable.utm_campaign,
        utm_medium: crmLeadTable.utm_medium,
        activo: crmLeadTable.activo,
        created_at: crmLeadTable.created_at,
        updated_at: crmLeadTable.updated_at,
      })
      .from(crmLeadTable)
      .leftJoin(crmEtapaTable, eq(crmLeadTable.etapa_id, crmEtapaTable.id))
      .leftJoin(usuarioTable, eq(crmLeadTable.vendedor_id, usuarioTable.id))
      .where(whereClause)
      .orderBy(desc(crmLeadTable.created_at))
      .limit(params.pageSize)
      .offset(offset);

    const countRows = await this.db
      .select({ total: count() })
      .from(crmLeadTable)
      .where(whereClause);
    const total = Number(countRows[0]?.total ?? 0);

    const leads = rows.map((r) => ({
      id: r.id,
      tenant_id: r.tenant_id,
      wa_cuenta_id: r.wa_cuenta_id,
      celular: r.celular,
      nombre: r.nombre,
      equipo_descripcion: r.equipo_descripcion,
      falla_descripcion: r.falla_descripcion,
      ubicacion: r.ubicacion,
      etapa_id: r.etapa_id,
      etapa_nombre: r.etapa_nombre ?? null,
      etapa_codigo: r.etapa_codigo ?? null,
      vendedor_id: r.vendedor_id,
      vendedor_nombre: r.vendedor_nombre ?? null,
      cliente_id: r.cliente_id,
      sucursal_id: r.sucursal_id,
      utm_source: r.utm_source,
      utm_campaign: r.utm_campaign,
      utm_medium: r.utm_medium,
      activo: r.activo,
      etiquetas: [] as CrmLead["etiquetas"],
      ultimo_mensaje: null as CrmLead["ultimo_mensaje"],
      notas: [] as CrmLead["notas"],
      eventos: [] as CrmLead["eventos"],
      created_at: r.created_at,
      updated_at: r.updated_at,
    })) as CrmLead[];

    if (leads.length > 0) {
      const leadIds = leads.map((l) => l.id);
      const etiquetaRows = await this.db
        .select({
          lead_id: crmLeadEtiquetaTable.lead_id,
          etiqueta_id: crmEtiquetaTable.id,
          nombre: crmEtiquetaTable.nombre,
          codigo: crmEtiquetaTable.codigo,
          grupo: crmEtiquetaTable.grupo,
          asignado_por: crmLeadEtiquetaTable.asignado_por,
          created_at: crmLeadEtiquetaTable.created_at,
        })
        .from(crmLeadEtiquetaTable)
        .innerJoin(crmEtiquetaTable, eq(crmLeadEtiquetaTable.etiqueta_id, crmEtiquetaTable.id))
        .where(inArray(crmLeadEtiquetaTable.lead_id, leadIds));

      for (const lead of leads) {
        lead.etiquetas = etiquetaRows
          .filter((r) => r.lead_id === lead.id)
          .map((r) => ({
            etiqueta_id: r.etiqueta_id,
            nombre: r.nombre,
            codigo: r.codigo,
            grupo: r.grupo,
            asignado_por: r.asignado_por,
            created_at: r.created_at,
          }));
      }
    }

    return { items: leads, total };
  }

  async findLeadById(tenantId: string, id: string): Promise<CrmLead | null> {
    const rows = await this.db.execute(sql`
      SELECT l.*,
             e.nombre AS etapa_nombre, e.codigo AS etapa_codigo,
             CASE WHEN u.id IS NOT NULL THEN u.nombres || ' ' || u.apellidos ELSE NULL END AS vendedor_nombre
      FROM crm_lead l
      LEFT JOIN crm_etapa e ON l.etapa_id = e.id
      LEFT JOIN usuario u ON l.vendedor_id = u.id
      WHERE l.id = ${id}::uuid AND l.tenant_id = ${tenantId}::uuid
    `);

    if (!rows[0]) return null;
    const lead = this.buildLeadFromRow(rows[0] as Record<string, unknown>);

    const etiquetaRows = await this.db
      .select({
        etiqueta_id: crmEtiquetaTable.id,
        nombre: crmEtiquetaTable.nombre,
        codigo: crmEtiquetaTable.codigo,
        grupo: crmEtiquetaTable.grupo,
        asignado_por: crmLeadEtiquetaTable.asignado_por,
        created_at: crmLeadEtiquetaTable.created_at,
      })
      .from(crmLeadEtiquetaTable)
      .innerJoin(crmEtiquetaTable, eq(crmLeadEtiquetaTable.etiqueta_id, crmEtiquetaTable.id))
      .where(eq(crmLeadEtiquetaTable.lead_id, id));

    lead.etiquetas = etiquetaRows.map((r) => ({
      etiqueta_id: r.etiqueta_id,
      nombre: r.nombre,
      codigo: r.codigo,
      grupo: r.grupo,
      asignado_por: r.asignado_por,
      created_at: r.created_at,
    }));

    const notaRows = await this.db
      .select()
      .from(crmNotaTable)
      .where(and(eq(crmNotaTable.lead_id, id), eq(crmNotaTable.tenant_id, tenantId)))
      .orderBy(desc(crmNotaTable.created_at));
    lead.notas = notaRows as unknown as CrmNota[];

    const eventoRows = await this.db
      .select()
      .from(crmEventoTable)
      .where(and(eq(crmEventoTable.lead_id, id), eq(crmEventoTable.tenant_id, tenantId)))
      .orderBy(desc(crmEventoTable.created_at));
    lead.eventos = eventoRows as unknown as typeof lead.eventos;

    return lead;
  }

  async moverEtapaLead(
    tenantId: string,
    id: string,
    etapaDestinoId: string,
    userId: string
  ): Promise<CrmLead> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const leadRows = await tx
        .select({
          id: crmLeadTable.id,
          etapa_id: crmLeadTable.etapa_id,
        })
        .from(crmLeadTable)
        .where(and(eq(crmLeadTable.id, id), eq(crmLeadTable.tenant_id, tenantId)));

      if (!leadRows[0]) throw new Error("Lead no encontrado");
      const etapaOrigenId = leadRows[0].etapa_id;

      const etapaRows = await tx
        .select({ codigo: crmEtapaTable.codigo })
        .from(crmEtapaTable)
        .where(eq(crmEtapaTable.id, etapaOrigenId));

      const codigoOrigen = etapaRows[0]?.codigo ?? "";

      if (codigoOrigen !== "DERIVACION_VENDEDOR") {
        const transicionRows = await tx
          .select({ id: crmEtapaTransicionTable.id })
          .from(crmEtapaTransicionTable)
          .where(
            and(
              eq(crmEtapaTransicionTable.tenant_id, tenantId),
              eq(crmEtapaTransicionTable.etapa_origen_id, etapaOrigenId),
              eq(crmEtapaTransicionTable.etapa_destino_id, etapaDestinoId)
            )
          );

        if (transicionRows.length === 0) throw new Error("Transición no permitida");
      }

      await tx
        .update(crmLeadTable)
        .set({ etapa_id: etapaDestinoId, updated_at: new Date() })
        .where(and(eq(crmLeadTable.id, id), eq(crmLeadTable.tenant_id, tenantId)));

      await tx.insert(crmEventoTable).values({
        tenant_id: tenantId,
        tipo: "ETAPA_CAMBIADA",
        origen: "VENDEDOR",
        lead_id: id,
        datos: {
          etapa_origen_id: etapaOrigenId,
          etapa_destino_id: etapaDestinoId,
          usuario_id: userId,
        },
      });

      const updated = await this.findLeadById(tenantId, id);
      if (!updated) throw new Error("Error al obtener lead actualizado");
      return updated;
    });
  }

  async asignarEtiquetas(
    tenantId: string,
    id: string,
    etiquetaIds: string[],
    asignadoPor: string
  ): Promise<CrmLead> {
    await this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      await tx.delete(crmLeadEtiquetaTable).where(eq(crmLeadEtiquetaTable.lead_id, id));

      if (etiquetaIds.length > 0) {
        await tx.insert(crmLeadEtiquetaTable).values(
          etiquetaIds.map((etiquetaId) => ({
            tenant_id: tenantId,
            lead_id: id,
            etiqueta_id: etiquetaId,
            asignado_por: asignadoPor as "NICO" | "VENDEDOR" | "SISTEMA",
          }))
        );
      }
    });

    const updated = await this.findLeadById(tenantId, id);
    if (!updated) throw new Error("Lead no encontrado");
    return updated;
  }

  async asignarVendedor(tenantId: string, id: string, vendedorId: string): Promise<CrmLead> {
    await this.db
      .update(crmLeadTable)
      .set({ vendedor_id: vendedorId, updated_at: new Date() })
      .where(and(eq(crmLeadTable.id, id), eq(crmLeadTable.tenant_id, tenantId)));

    const updated = await this.findLeadById(tenantId, id);
    if (!updated) throw new Error("Lead no encontrado");
    return updated;
  }

  async roundRobinVendedor(
    tenantId: string,
    sucursalId?: string | undefined
  ): Promise<string | null> {
    const conditions = [
      eq(usuarioTable.tenant_id, tenantId),
      eq(usuarioTable.rol, "VENDEDOR"),
      eq(usuarioTable.activo, true),
    ];
    if (sucursalId) {
      conditions.push(eq(usuarioTable.sucursal_id, sucursalId));
    }

    const vendedores = await this.db
      .select({ id: usuarioTable.id })
      .from(usuarioTable)
      .where(and(...conditions));

    if (vendedores.length === 0) return null;

    const vendedorIds = vendedores.map((v) => v.id);

    const leadCounts = await this.db
      .select({
        vendedor_id: crmLeadTable.vendedor_id,
        n: count(),
      })
      .from(crmLeadTable)
      .where(
        and(
          eq(crmLeadTable.tenant_id, tenantId),
          eq(crmLeadTable.activo, true),
          inArray(crmLeadTable.vendedor_id, vendedorIds)
        )
      )
      .groupBy(crmLeadTable.vendedor_id);

    const countMap = new Map<string, number>();
    for (const row of leadCounts) {
      if (row.vendedor_id) countMap.set(row.vendedor_id, Number(row.n));
    }

    let minId: string | null = null;
    let minCount = Number.POSITIVE_INFINITY;
    for (const v of vendedores) {
      const n = countMap.get(v.id) ?? 0;
      if (n < minCount) {
        minCount = n;
        minId = v.id;
      }
    }

    return minId;
  }

  async createNota(
    tenantId: string,
    leadId: string,
    contenido: string,
    userId: string
  ): Promise<CrmNota> {
    const [row] = await this.db
      .insert(crmNotaTable)
      .values({
        tenant_id: tenantId,
        lead_id: leadId,
        contenido,
        origen: "VENDEDOR",
        created_by: userId,
      })
      .returning();
    return row as unknown as CrmNota;
  }

  // ─── Conversaciones ────────────────────────────────────────────────────────

  private buildConversacionFromRow(row: Record<string, unknown>): CrmConversacion {
    let ultimoMensaje = null;
    if (row.ultimo_mensaje) {
      try {
        ultimoMensaje =
          typeof row.ultimo_mensaje === "string"
            ? JSON.parse(row.ultimo_mensaje)
            : row.ultimo_mensaje;
      } catch {
        ultimoMensaje = null;
      }
    }

    return {
      id: row.id as string,
      tenant_id: row.tenant_id as string,
      wa_cuenta_id: row.wa_cuenta_id as string,
      lead_id: row.lead_id as string,
      lead_nombre: (row.lead_nombre as string | null) ?? null,
      lead_celular: row.lead_celular as string,
      lead_etapa_id: (row.lead_etapa_id as string | null) ?? null,
      lead_etapa_nombre: (row.lead_etapa_nombre as string | null) ?? null,
      celular: row.celular as string,
      modo: row.modo as string,
      estado: row.estado as string,
      ultimo_mensaje_at: row.ultimo_mensaje_at ? new Date(row.ultimo_mensaje_at as string) : null,
      mensajes_sin_leer: Number(row.mensajes_sin_leer ?? 0),
      ultimo_mensaje: ultimoMensaje,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  async listConversaciones(
    tenantId: string,
    params: ListConversacionesParams
  ): Promise<{ items: CrmConversacion[]; total: number }> {
    const conds = [eq(crmConversacionTable.tenant_id, tenantId)];
    if (params.modo) conds.push(eq(crmConversacionTable.modo, params.modo as "NICO" | "VENDEDOR"));
    if (params.estado)
      conds.push(eq(crmConversacionTable.estado, params.estado as "ACTIVA" | "CERRADA"));
    if (params.wa_cuenta_id) conds.push(eq(crmConversacionTable.wa_cuenta_id, params.wa_cuenta_id));
    if (params.desde) conds.push(gte(crmConversacionTable.created_at, new Date(params.desde)));
    if (params.hasta) conds.push(lte(crmConversacionTable.created_at, new Date(params.hasta)));

    const whereClause = and(...conds);
    const offset = (params.page - 1) * params.pageSize;

    const rows = await this.db.execute(sql`
      SELECT c.id, c.tenant_id, c.wa_cuenta_id, c.lead_id, c.celular, c.modo, c.estado,
             c.ultimo_mensaje_at, c.mensajes_sin_leer, c.created_at, c.updated_at,
             l.nombre AS lead_nombre, l.celular AS lead_celular, l.etapa_id AS lead_etapa_id,
             e.nombre AS lead_etapa_nombre,
             (
               SELECT json_build_object(
                 'id', m.id, 'contenido', m.contenido, 'origen', m.origen,
                 'direccion', m.direccion, 'tipo', m.tipo, 'created_at', m.created_at
               )
               FROM crm_mensaje m WHERE m.conversacion_id = c.id
               ORDER BY m.created_at DESC LIMIT 1
             ) AS ultimo_mensaje
      FROM crm_conversacion c
      JOIN crm_lead l ON c.lead_id = l.id
      LEFT JOIN crm_etapa e ON l.etapa_id = e.id
      WHERE c.tenant_id = ${tenantId}::uuid
        ${params.modo ? sql`AND c.modo = ${params.modo}` : sql``}
        ${params.estado ? sql`AND c.estado = ${params.estado}` : sql``}
        ${params.wa_cuenta_id ? sql`AND c.wa_cuenta_id = ${params.wa_cuenta_id}::uuid` : sql``}
        ${params.desde ? sql`AND c.created_at >= ${params.desde}::timestamptz` : sql``}
        ${params.hasta ? sql`AND c.created_at <= ${params.hasta}::timestamptz` : sql``}
      ORDER BY c.ultimo_mensaje_at DESC NULLS LAST
      LIMIT ${params.pageSize} OFFSET ${offset}
    `);

    const countRows = await this.db
      .select({ total: count() })
      .from(crmConversacionTable)
      .where(whereClause);
    const total = Number(countRows[0]?.total ?? 0);

    const items = (rows as unknown as Record<string, unknown>[]).map(
      this.buildConversacionFromRow.bind(this)
    );
    return { items, total };
  }

  async findConversacionById(tenantId: string, id: string): Promise<CrmConversacion | null> {
    const rows = await this.db.execute(sql`
      SELECT c.*,
             l.nombre AS lead_nombre, l.celular AS lead_celular, l.etapa_id AS lead_etapa_id,
             e.nombre AS lead_etapa_nombre,
             (
               SELECT json_build_object(
                 'id', m.id, 'contenido', m.contenido, 'origen', m.origen,
                 'direccion', m.direccion, 'tipo', m.tipo, 'created_at', m.created_at
               )
               FROM crm_mensaje m WHERE m.conversacion_id = c.id
               ORDER BY m.created_at DESC LIMIT 1
             ) AS ultimo_mensaje
      FROM crm_conversacion c
      JOIN crm_lead l ON c.lead_id = l.id
      LEFT JOIN crm_etapa e ON l.etapa_id = e.id
      WHERE c.id = ${id}::uuid AND c.tenant_id = ${tenantId}::uuid
    `);

    if (!rows[0]) return null;
    return this.buildConversacionFromRow(rows[0] as Record<string, unknown>);
  }

  async listMensajes(
    tenantId: string,
    conversacionId: string,
    params: ListMensajesParams
  ): Promise<{ items: CrmMensaje[]; total: number }> {
    const conditions = [
      eq(crmMensajeTable.conversacion_id, conversacionId),
      eq(crmMensajeTable.tenant_id, tenantId),
    ];

    if (params.antes_de) {
      conditions.push(lte(crmMensajeTable.created_at, new Date(params.antes_de)));
    }

    const offset = (params.page - 1) * params.pageSize;

    const items = await this.db
      .select()
      .from(crmMensajeTable)
      .where(and(...conditions))
      .orderBy(desc(crmMensajeTable.created_at))
      .limit(params.pageSize)
      .offset(offset);

    const countRows = await this.db
      .select({ n: count() })
      .from(crmMensajeTable)
      .where(and(...conditions));

    const total = Number(countRows[0]?.n ?? 0);
    return { items: items as unknown as CrmMensaje[], total };
  }

  async guardarMensaje(tenantId: string, data: GuardarMensajeData): Promise<CrmMensaje> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const [mensaje] = await tx
        .insert(crmMensajeTable)
        .values({
          tenant_id: tenantId,
          conversacion_id: data.conversacion_id,
          ...(data.wa_message_id !== undefined ? { wa_message_id: data.wa_message_id } : {}),
          direccion: data.direccion as "ENTRANTE" | "SALIENTE",
          origen: data.origen as "CLIENTE" | "AGENTE" | "VENDEDOR" | "BOT" | "SISTEMA",
          tipo: (data.tipo ?? "TEXTO") as "TEXTO" | "IMAGEN" | "PLANTILLA" | "LINK",
          contenido: data.contenido,
          ...(data.metadata !== undefined ? { metadata: data.metadata } : {}),
        })
        .returning();

      if (!mensaje) throw new Error("Error al guardar mensaje");

      await tx
        .update(crmConversacionTable)
        .set({
          ultimo_mensaje_at: mensaje.created_at,
          mensajes_sin_leer: sql`${crmConversacionTable.mensajes_sin_leer} + ${data.direccion === "ENTRANTE" ? 1 : 0}`,
          updated_at: new Date(),
        })
        .where(
          and(
            eq(crmConversacionTable.id, data.conversacion_id),
            eq(crmConversacionTable.tenant_id, tenantId)
          )
        );

      if (data.origen === "VENDEDOR" && data.direccion === "SALIENTE") {
        const convRows = await tx
          .select({ modo: crmConversacionTable.modo })
          .from(crmConversacionTable)
          .where(
            and(
              eq(crmConversacionTable.id, data.conversacion_id),
              eq(crmConversacionTable.tenant_id, tenantId)
            )
          );

        if (convRows[0]?.modo === "NICO") {
          await tx
            .update(crmConversacionTable)
            .set({ modo: "VENDEDOR", updated_at: new Date() })
            .where(
              and(
                eq(crmConversacionTable.id, data.conversacion_id),
                eq(crmConversacionTable.tenant_id, tenantId)
              )
            );
        }
      }

      return mensaje as unknown as CrmMensaje;
    });
  }

  async cambiarModo(tenantId: string, id: string, modo: string): Promise<CrmConversacion | null> {
    const rows = await this.db
      .update(crmConversacionTable)
      .set({ modo: modo as "NICO" | "VENDEDOR", updated_at: new Date() })
      .where(and(eq(crmConversacionTable.id, id), eq(crmConversacionTable.tenant_id, tenantId)))
      .returning({ id: crmConversacionTable.id });

    if (rows.length === 0) return null;
    return this.findConversacionById(tenantId, id);
  }

  async asignarVendedorConv(
    tenantId: string,
    id: string,
    vendedorId: string
  ): Promise<CrmConversacion | null> {
    const convRows = await this.db
      .select({ lead_id: crmConversacionTable.lead_id })
      .from(crmConversacionTable)
      .where(and(eq(crmConversacionTable.id, id), eq(crmConversacionTable.tenant_id, tenantId)));

    if (!convRows[0]) return null;

    await this.db
      .update(crmLeadTable)
      .set({ vendedor_id: vendedorId, updated_at: new Date() })
      .where(and(eq(crmLeadTable.id, convRows[0].lead_id), eq(crmLeadTable.tenant_id, tenantId)));

    return this.findConversacionById(tenantId, id);
  }

  async getUltimoMensajeEntrante(tenantId: string, conversacionId: string): Promise<Date | null> {
    const rows = await this.db.execute(sql`
      SELECT MAX(created_at) AS ultimo
      FROM crm_mensaje
      WHERE conversacion_id = ${conversacionId}::uuid
        AND tenant_id = ${tenantId}::uuid
        AND direccion = 'ENTRANTE'
    `);

    const val = (rows[0] as Record<string, unknown>)?.ultimo;
    if (!val) return null;
    return new Date(val as string);
  }
}
