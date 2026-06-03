import type { DbClient } from "@kallpasoft/db";
import {
  cliente as clienteTable,
  costoRevision as costoRevisionTable,
  crmAccionAgente as crmAccionAgenteTable,
  crmAgente as crmAgenteTable,
  crmBot as crmBotTable,
  crmConversacion as crmConversacionTable,
  crmEtapa as crmEtapaTable,
  crmEtapaTransicion as crmEtapaTransicionTable,
  crmEtiqueta as crmEtiquetaTable,
  crmEvento as crmEventoTable,
  crmLeadEtiqueta as crmLeadEtiquetaTable,
  crmLead as crmLeadTable,
  crmMensajeInterno as crmMensajeInternoTable,
  crmMensaje as crmMensajeTable,
  crmNota as crmNotaTable,
  crmPlantilla as crmPlantillaTable,
  instancia as instanciaTable,
  lote as loteTable,
  ordenServicio as osTable,
  producto as productoTable,
  sucursal as sucursalTable,
  usuario as usuarioTable,
  waCuenta as waCuentaTable,
} from "@kallpasoft/db";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, sum } from "drizzle-orm";
import type {
  Audiencia,
  CrmAccionAgenteItem,
  CrmAgente,
  CrmBot,
  CrmConversacion,
  CrmConversacionInterna,
  CrmEtapa,
  CrmEtapaTransicion,
  CrmEtiqueta,
  CrmLead,
  CrmMensaje,
  CrmMensajeInterno,
  CrmNota,
  CrmPlantilla,
  MetricaLead,
  MetricasClientes,
  MetricasDashboard,
  MetricasNico,
  MetricasVentas,
  WaCuenta,
} from "../../domain/entities/crm.js";
import type {
  AgenteActivo,
  ClienteResult,
  CrearClienteData,
  CrearConversacionData,
  CrearServicioData,
  CreateEtapaData,
  CreateEtiquetaData,
  CreateMensajeInternoData,
  CreatePlantillaData,
  CreateWaCuentaData,
  GuardarMensajeData,
  ICrmRepository,
  LastBotMessage,
  LeadForAgent,
  ListAccionesAgenteParams,
  ListConversacionesParams,
  ListEventosParams,
  ListLeadsParams,
  ListMensajesParams,
  LogAccionData,
  MensajeContexto,
  OrdenServicioResult,
  RepuestoResult,
  ServicioClienteResult,
  UpdateAgenteData,
  UpdateBotData,
  UpdateEtapaData,
  UpdateEtiquetaData,
  UpdatePlantillaData,
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
        // biome-ignore lint/style/noNonNullAssertion: or() with two defined args cannot be undefined
        or(
          ilike(crmLeadTable.nombre, `%${params.search}%`),
          ilike(crmLeadTable.celular, `%${params.search}%`)
        )!
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

  // ─── Webhook ───────────────────────────────────────────────────────────────

  async findWaCuentaByVerifyToken(verifyToken: string): Promise<WaCuenta | null> {
    const rows = await this.db.execute(sql`
      SELECT id, tenant_id, negocio_nombre, phone_number_id, waba_id,
             webhook_verify_token, nombre, activo, created_at, updated_at
      FROM wa_cuenta
      WHERE webhook_verify_token = ${verifyToken} AND activo = true
      LIMIT 1
    `);
    if (!rows[0]) return null;
    return rows[0] as unknown as WaCuenta;
  }

  async findWaCuentaByPhoneNumberId(phoneNumberId: string): Promise<WaCuenta | null> {
    const rows = await this.db.execute(sql`
      SELECT id, tenant_id, negocio_nombre, phone_number_id, waba_id,
             webhook_verify_token, nombre, activo, created_at, updated_at
      FROM wa_cuenta
      WHERE phone_number_id = ${phoneNumberId} AND activo = true
      LIMIT 1
    `);
    if (!rows[0]) return null;
    return rows[0] as unknown as WaCuenta;
  }

  async existsMensajeByWaId(tenantId: string, waMessageId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: crmMensajeTable.id })
      .from(crmMensajeTable)
      .where(
        and(eq(crmMensajeTable.wa_message_id, waMessageId), eq(crmMensajeTable.tenant_id, tenantId))
      )
      .limit(1);
    return rows.length > 0;
  }

  async findConversacionActivaByCelular(
    tenantId: string,
    waCuentaId: string,
    celular: string
  ): Promise<CrmConversacion | null> {
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
        AND c.wa_cuenta_id = ${waCuentaId}::uuid
        AND c.celular = ${celular}
        AND c.estado = 'ACTIVA'
      ORDER BY c.created_at DESC
      LIMIT 1
    `);
    if (!rows[0]) return null;
    return this.buildConversacionFromRow(rows[0] as Record<string, unknown>);
  }

  async crearConversacionConLead(
    tenantId: string,
    data: CrearConversacionData
  ): Promise<CrmConversacion> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // 1. Buscar etapa PRIMER_CONTACTO
      const etapaRows = await tx
        .select({ id: crmEtapaTable.id })
        .from(crmEtapaTable)
        .where(
          and(
            eq(crmEtapaTable.tenant_id, tenantId),
            eq(crmEtapaTable.codigo, "PRIMER_CONTACTO"),
            eq(crmEtapaTable.activo, true)
          )
        )
        .limit(1);

      const etapaId = etapaRows[0]?.id;
      if (!etapaId) throw new Error("Etapa PRIMER_CONTACTO no encontrada");

      // 2. INSERT crm_lead
      const leadRows = await tx
        .insert(crmLeadTable)
        .values({
          tenant_id: tenantId,
          wa_cuenta_id: data.waCuentaId,
          celular: data.celular,
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          etapa_id: etapaId,
        })
        .returning({ id: crmLeadTable.id });

      const leadId = leadRows[0]?.id;
      if (!leadId) throw new Error("Error al crear lead");

      // 3. INSERT crm_conversacion
      const convRows = await tx
        .insert(crmConversacionTable)
        .values({
          tenant_id: tenantId,
          wa_cuenta_id: data.waCuentaId,
          lead_id: leadId,
          celular: data.celular,
        })
        .returning({ id: crmConversacionTable.id });

      const convId = convRows[0]?.id;
      if (!convId) throw new Error("Error al crear conversación");

      // 4. Registrar evento LEAD_CREADO
      await tx.insert(crmEventoTable).values({
        tenant_id: tenantId,
        tipo: "LEAD_CREADO",
        origen: "SISTEMA",
        lead_id: leadId,
        conversacion_id: convId,
        datos: { celular: data.celular, nombre: data.nombre ?? null },
      });

      // 5. Retornar conversación completa
      const result = await this.findConversacionById(tenantId, convId);
      if (!result) throw new Error("Error al obtener conversación creada");
      return result;
    });
  }

  // ─── Agent ─────────────────────────────────────────────────────────────────

  async findLeadForAgent(tenantId: string, leadId: string): Promise<LeadForAgent | null> {
    const rows = await this.db.execute(sql`
      SELECT l.id, l.celular, l.nombre, l.equipo_descripcion, l.falla_descripcion, l.ubicacion,
             l.etapa_id, l.vendedor_id, l.cliente_id, l.sucursal_id,
             e.codigo AS etapa_codigo, e.nombre AS etapa_nombre, e.objetivo AS etapa_objetivo,
             e.operador AS etapa_operador, e.bot_id AS etapa_bot_id
      FROM crm_lead l
      JOIN crm_etapa e ON l.etapa_id = e.id
      WHERE l.id = ${leadId}::uuid AND l.tenant_id = ${tenantId}::uuid
    `);
    if (!rows[0]) return null;
    const r = rows[0] as Record<string, unknown>;
    return {
      id: r.id as string,
      celular: r.celular as string,
      nombre: (r.nombre as string | null) ?? null,
      equipo_descripcion: (r.equipo_descripcion as string | null) ?? null,
      falla_descripcion: (r.falla_descripcion as string | null) ?? null,
      ubicacion: (r.ubicacion as string | null) ?? null,
      etapa_id: r.etapa_id as string,
      etapa_codigo: r.etapa_codigo as string,
      etapa_nombre: r.etapa_nombre as string,
      etapa_objetivo: (r.etapa_objetivo as string | null) ?? null,
      etapa_operador: (r.etapa_operador as string) ?? "HUMANO",
      etapa_bot_id: (r.etapa_bot_id as string | null) ?? null,
      vendedor_id: (r.vendedor_id as string | null) ?? null,
      cliente_id: (r.cliente_id as string | null) ?? null,
      sucursal_id: (r.sucursal_id as string | null) ?? null,
    };
  }

  async findAgenteActivo(tenantId: string, canal: string): Promise<AgenteActivo | null> {
    const rows = await this.db
      .select({
        id: crmAgenteTable.id,
        nombre: crmAgenteTable.nombre,
        modelo_ia: crmAgenteTable.modelo_ia,
        tono: crmAgenteTable.tono,
        prompt_base: crmAgenteTable.prompt_base,
        max_mensajes_contexto: crmAgenteTable.max_mensajes_contexto,
      })
      .from(crmAgenteTable)
      .where(
        and(
          eq(crmAgenteTable.tenant_id, tenantId),
          eq(crmAgenteTable.canal, canal),
          eq(crmAgenteTable.activo, true)
        )
      )
      .limit(1);

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      nombre: r.nombre,
      modelo_ia: r.modelo_ia,
      tono: r.tono ?? null,
      prompt_base: r.prompt_base ?? null,
      max_mensajes_contexto: r.max_mensajes_contexto,
    };
  }

  async listMensajesParaContexto(
    tenantId: string,
    conversacionId: string,
    limit: number
  ): Promise<MensajeContexto[]> {
    const rows = await this.db
      .select({
        id: crmMensajeTable.id,
        direccion: crmMensajeTable.direccion,
        origen: crmMensajeTable.origen,
        contenido: crmMensajeTable.contenido,
        created_at: crmMensajeTable.created_at,
      })
      .from(crmMensajeTable)
      .where(
        and(
          eq(crmMensajeTable.conversacion_id, conversacionId),
          eq(crmMensajeTable.tenant_id, tenantId)
        )
      )
      .orderBy(desc(crmMensajeTable.created_at))
      .limit(limit);

    // Retornar en orden ASCENDENTE para historial de conversación
    return rows.reverse().map((r) => ({
      id: r.id,
      direccion: r.direccion,
      origen: r.origen,
      contenido: r.contenido ?? null,
      created_at: r.created_at,
    }));
  }

  async logAccionAgente(tenantId: string, data: LogAccionData): Promise<void> {
    await this.db.insert(crmAccionAgenteTable).values({
      tenant_id: tenantId,
      agente_id: data.agente_id,
      conversacion_id: data.conversacion_id,
      lead_id: data.lead_id,
      tool_name: data.tool_name,
      tool_input: data.tool_input as Record<string, unknown>,
      tool_output: data.tool_output as Record<string, unknown>,
      exitoso: data.exitoso,
      duracion_ms: data.duracion_ms,
      ...(data.error !== undefined ? { error: data.error } : {}),
    });
  }

  // ─── Tools ─────────────────────────────────────────────────────────────────

  async guardarDatoLead(
    tenantId: string,
    leadId: string,
    campo: string,
    valor: string
  ): Promise<void> {
    const camposPermitidos = ["nombre", "equipo_descripcion", "falla_descripcion", "ubicacion"];
    if (!camposPermitidos.includes(campo)) {
      throw new Error(`Campo no permitido: ${campo}`);
    }
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    updateData[campo] = valor;
    await this.db
      .update(crmLeadTable)
      .set(updateData)
      .where(and(eq(crmLeadTable.id, leadId), eq(crmLeadTable.tenant_id, tenantId)));
  }

  async asignarEtiquetaNico(
    tenantId: string,
    leadId: string,
    codigoEtiqueta: string
  ): Promise<void> {
    const etiquetaRows = await this.db
      .select({ id: crmEtiquetaTable.id })
      .from(crmEtiquetaTable)
      .where(
        and(eq(crmEtiquetaTable.tenant_id, tenantId), eq(crmEtiquetaTable.codigo, codigoEtiqueta))
      )
      .limit(1);

    const etiqueta = etiquetaRows[0];
    if (!etiqueta) return;

    await this.db
      .insert(crmLeadEtiquetaTable)
      .values({
        tenant_id: tenantId,
        lead_id: leadId,
        etiqueta_id: etiqueta.id,
        asignado_por: "NICO",
      })
      .onConflictDoNothing();
  }

  async findEtapaByCodigo(
    tenantId: string,
    codigo: string
  ): Promise<{ id: string; nombre: string; codigo: string } | null> {
    const rows = await this.db
      .select({ id: crmEtapaTable.id, nombre: crmEtapaTable.nombre, codigo: crmEtapaTable.codigo })
      .from(crmEtapaTable)
      .where(and(eq(crmEtapaTable.tenant_id, tenantId), eq(crmEtapaTable.codigo, codigo)))
      .limit(1);
    return rows[0] ?? null;
  }

  async buscarClientePorDocOrCelular(
    tenantId: string,
    numeroDoc?: string | undefined,
    celular?: string | undefined
  ): Promise<ClienteResult | null> {
    if (!numeroDoc && !celular) return null;

    const conds = [eq(clienteTable.tenant_id, tenantId)];
    const orConds = [];
    if (numeroDoc) orConds.push(eq(clienteTable.numero_documento, numeroDoc));
    if (celular) orConds.push(eq(clienteTable.telefono, celular));
    if (orConds.length > 0) conds.push(or(...orConds)!);

    const rows = await this.db
      .select({
        id: clienteTable.id,
        nombres: clienteTable.nombres,
        apellidos: clienteTable.apellidos,
        razon_social: clienteTable.razon_social,
        numero_documento: clienteTable.numero_documento,
        tipo_documento: clienteTable.tipo_documento,
        telefono: clienteTable.telefono,
      })
      .from(clienteTable)
      .where(and(...conds))
      .limit(1);

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      nombres: r.nombres ?? null,
      apellidos: r.apellidos ?? null,
      razon_social: r.razon_social ?? null,
      numero_documento: r.numero_documento,
      tipo_documento: r.tipo_documento,
      telefono: r.telefono ?? null,
    };
  }

  async crearClienteNico(tenantId: string, data: CrearClienteData): Promise<ClienteResult> {
    // TipoDocumento enum: DNI | RUC | CE — PASAPORTE no existe en el schema
    const rawTipo = data.tipo_documento ?? "DNI";
    const tipoDoc = (["DNI", "RUC", "CE"].includes(rawTipo) ? rawTipo : "DNI") as
      | "DNI"
      | "RUC"
      | "CE";

    const [inserted] = await this.db
      .insert(clienteTable)
      .values({
        tenant_id: tenantId,
        tipo_documento: tipoDoc,
        numero_documento: data.numero_doc,
        tipo_persona: "NATURAL",
        nombres: data.nombre,
        telefono: data.celular,
      })
      .returning({
        id: clienteTable.id,
        nombres: clienteTable.nombres,
        apellidos: clienteTable.apellidos,
        razon_social: clienteTable.razon_social,
        numero_documento: clienteTable.numero_documento,
        tipo_documento: clienteTable.tipo_documento,
        telefono: clienteTable.telefono,
      });

    if (!inserted) throw new Error("Error al crear cliente");

    // Vincular al lead si se proporcionó leadId
    if (data.leadId) {
      await this.db
        .update(crmLeadTable)
        .set({ cliente_id: inserted.id, updated_at: new Date() })
        .where(and(eq(crmLeadTable.id, data.leadId), eq(crmLeadTable.tenant_id, tenantId)));
    }

    return {
      id: inserted.id,
      nombres: inserted.nombres ?? null,
      apellidos: inserted.apellidos ?? null,
      razon_social: inserted.razon_social ?? null,
      numero_documento: inserted.numero_documento,
      tipo_documento: inserted.tipo_documento,
      telefono: inserted.telefono ?? null,
    };
  }

  async crearServicioNico(tenantId: string, data: CrearServicioData): Promise<OrdenServicioResult> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      // 1. Verificar que lead tiene cliente_id
      const leadRows = await tx
        .select({ cliente_id: crmLeadTable.cliente_id, sucursal_id: crmLeadTable.sucursal_id })
        .from(crmLeadTable)
        .where(and(eq(crmLeadTable.id, data.leadId), eq(crmLeadTable.tenant_id, tenantId)));

      const lead = leadRows[0];
      if (!lead?.cliente_id) throw new Error("El lead no tiene cliente asociado");

      const clienteId = lead.cliente_id;

      // 2. Buscar primera instancia del cliente
      const instanciaRows = await tx
        .select({ id: instanciaTable.id })
        .from(instanciaTable)
        .where(
          and(
            eq(instanciaTable.tenant_id, tenantId),
            eq(instanciaTable.cliente_id, clienteId),
            eq(instanciaTable.activo, true)
          )
        )
        .limit(1);

      let instanciaId = instanciaRows[0]?.id;

      if (!instanciaId) {
        // 3. Buscar producto para crear instancia placeholder
        let productoId: string | null = null;

        if (data.categoria_id) {
          const prodRows = await tx
            .select({ id: productoTable.id })
            .from(productoTable)
            .where(
              and(
                eq(productoTable.tenant_id, tenantId),
                eq(productoTable.categoria_id, data.categoria_id),
                eq(productoTable.activo, true)
              )
            )
            .limit(1);
          productoId = prodRows[0]?.id ?? null;
        }

        if (!productoId) {
          const prodRows = await tx
            .select({ id: productoTable.id })
            .from(productoTable)
            .where(and(eq(productoTable.tenant_id, tenantId), eq(productoTable.activo, true)))
            .limit(1);
          productoId = prodRows[0]?.id ?? null;
        }

        if (!productoId) throw new Error("No se encontró un producto para crear la instancia");

        // 4. Crear instancia
        const newInstancia = await tx
          .insert(instanciaTable)
          .values({
            tenant_id: tenantId,
            cliente_id: clienteId,
            producto_id: productoId,
          })
          .returning({ id: instanciaTable.id });

        instanciaId = newInstancia[0]?.id;
        if (!instanciaId) throw new Error("Error al crear instancia");
      }

      // 5. Generar código OS
      const countRows = await tx.execute(
        sql`SELECT COUNT(*)::int AS n FROM orden_servicio WHERE tenant_id = ${tenantId}::uuid`
      );
      const n = Number((countRows[0] as Record<string, unknown>)?.n ?? 0);
      const codigo = `OS-${String(n + 1).padStart(5, "0")}`;

      // 6. Obtener costo_revision
      let costoRevisionMonto = "0.00";
      if (data.categoria_id) {
        const costoRows = await tx
          .select({ monto: costoRevisionTable.monto })
          .from(costoRevisionTable)
          .where(
            and(
              eq(costoRevisionTable.tenant_id, tenantId),
              eq(costoRevisionTable.categoria_id, data.categoria_id),
              eq(costoRevisionTable.activo, true)
            )
          )
          .limit(1);
        if (costoRows[0]) costoRevisionMonto = costoRows[0].monto;
      }

      // 7. INSERT orden_servicio
      const rawCanal = data.canal ?? "WHATSAPP";
      const canal = (
        ["TIENDA", "DOMICILIO", "WHATSAPP"].includes(rawCanal) ? rawCanal : "WHATSAPP"
      ) as "TIENDA" | "DOMICILIO" | "WHATSAPP";
      const osRows = await tx
        .insert(osTable)
        .values({
          tenant_id: tenantId,
          codigo,
          instancia_id: instanciaId,
          canal,
          falla_ingreso: data.falla_ingreso,
          costo_revision: costoRevisionMonto,
          estado: "VALIDACION",
          ...(lead.sucursal_id ? { sucursal_id: lead.sucursal_id } : {}),
          lead_id: data.leadId,
        })
        .returning({ id: osTable.id, codigo: osTable.codigo, estado: osTable.estado });

      const os = osRows[0];
      if (!os) throw new Error("Error al crear orden de servicio");

      // 8. Mover lead a etapa CONVERTIDO
      const etapaConvertido = await this.findEtapaByCodigo(tenantId, "CONVERTIDO");
      if (etapaConvertido) {
        await tx
          .update(crmLeadTable)
          .set({ etapa_id: etapaConvertido.id, updated_at: new Date() })
          .where(and(eq(crmLeadTable.id, data.leadId), eq(crmLeadTable.tenant_id, tenantId)));
      }

      return { id: os.id, codigo: os.codigo, estado: os.estado };
    });
  }

  async derivarVendedorNico(
    tenantId: string,
    leadId: string,
    conversacionId: string,
    motivo: string
  ): Promise<{ vendedor_id: string | null; vendedor_nombre: string | null }> {
    // 1. UPDATE crm_conversacion modo = VENDEDOR
    await this.db
      .update(crmConversacionTable)
      .set({ modo: "VENDEDOR", updated_at: new Date() })
      .where(
        and(
          eq(crmConversacionTable.id, conversacionId),
          eq(crmConversacionTable.tenant_id, tenantId)
        )
      );

    // 2. Buscar vendedor via roundRobin
    const vendedorId = await this.roundRobinVendedor(tenantId);
    let vendedorNombre: string | null = null;

    if (vendedorId) {
      // 3. UPDATE crm_lead vendedor_id
      await this.db
        .update(crmLeadTable)
        .set({ vendedor_id: vendedorId, updated_at: new Date() })
        .where(and(eq(crmLeadTable.id, leadId), eq(crmLeadTable.tenant_id, tenantId)));

      const uRows = await this.db
        .select({ nombres: usuarioTable.nombres, apellidos: usuarioTable.apellidos })
        .from(usuarioTable)
        .where(eq(usuarioTable.id, vendedorId))
        .limit(1);
      if (uRows[0]) {
        vendedorNombre = `${uRows[0].nombres} ${uRows[0].apellidos}`.trim();
      }
    }

    // 4. INSERT crm_evento DERIVACION
    await this.db.insert(crmEventoTable).values({
      tenant_id: tenantId,
      tipo: "DERIVACION",
      origen: "NICO",
      lead_id: leadId,
      conversacion_id: conversacionId,
      datos: { motivo, vendedor_id: vendedorId, vendedor_nombre: vendedorNombre },
    });

    // 5. INSERT crm_nota
    await this.db.insert(crmNotaTable).values({
      tenant_id: tenantId,
      lead_id: leadId,
      contenido: `Derivación por: ${motivo}`,
      origen: "NICO",
    });

    return { vendedor_id: vendedorId, vendedor_nombre: vendedorNombre };
  }

  async findSucursalById(
    tenantId: string,
    sucursalId: string
  ): Promise<{ id: string; nombre: string; direccion: string | null } | null> {
    const rows = await this.db
      .select({
        id: sucursalTable.id,
        nombre: sucursalTable.nombre,
        direccion: sucursalTable.direccion,
      })
      .from(sucursalTable)
      .where(and(eq(sucursalTable.id, sucursalId), eq(sucursalTable.tenant_id, tenantId)))
      .limit(1);
    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      nombre: rows[0].nombre,
      direccion: rows[0].direccion ?? null,
    };
  }

  async consultarRepuestos(
    tenantId: string,
    busqueda: string,
    categoriaId?: string | undefined
  ): Promise<RepuestoResult[]> {
    const conds = [
      eq(productoTable.tenant_id, tenantId),
      eq(productoTable.activo, true),
      ilike(productoTable.nombre, `%${busqueda}%`),
    ];
    if (categoriaId) conds.push(eq(productoTable.categoria_id, categoriaId));

    const productos = await this.db
      .select({
        id: productoTable.id,
        nombre: productoTable.nombre,
        codigo: productoTable.codigo,
        precio_venta: productoTable.precio_venta,
      })
      .from(productoTable)
      .where(and(...conds))
      .limit(5);

    const results: RepuestoResult[] = [];
    for (const p of productos) {
      const stockRows = await this.db
        .select({ total: sum(loteTable.cantidad_actual) })
        .from(loteTable)
        .where(
          and(
            eq(loteTable.producto_id, p.id),
            eq(loteTable.activo, true),
            eq(loteTable.tenant_id, tenantId)
          )
        );
      const stockDisponible = Number(stockRows[0]?.total ?? 0);
      results.push({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        stock_disponible: stockDisponible,
        precio_venta: p.precio_venta,
      });
    }
    return results;
  }

  // ─── Plantillas ────────────────────────────────────────────────────────────

  async listPlantillas(tenantId: string): Promise<CrmPlantilla[]> {
    const rows = await this.db
      .select()
      .from(crmPlantillaTable)
      .where(eq(crmPlantillaTable.tenant_id, tenantId))
      .orderBy(asc(crmPlantillaTable.created_at));
    return rows.map((r) => ({
      id: r.id,
      tenant_id: r.tenant_id,
      nombre: r.nombre,
      contenido: r.contenido,
      variables: (r.variables as string[] | null) ?? null,
      meta_template_name: r.meta_template_name ?? null,
      estado_meta: r.estado_meta,
      created_by: r.created_by ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async findPlantillaById(tenantId: string, id: string): Promise<CrmPlantilla | null> {
    const rows = await this.db
      .select()
      .from(crmPlantillaTable)
      .where(and(eq(crmPlantillaTable.id, id), eq(crmPlantillaTable.tenant_id, tenantId)))
      .limit(1);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      tenant_id: r.tenant_id,
      nombre: r.nombre,
      contenido: r.contenido,
      variables: (r.variables as string[] | null) ?? null,
      meta_template_name: r.meta_template_name ?? null,
      estado_meta: r.estado_meta,
      created_by: r.created_by ?? null,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  async createPlantilla(
    tenantId: string,
    data: CreatePlantillaData,
    userId: string
  ): Promise<CrmPlantilla> {
    const [row] = await this.db
      .insert(crmPlantillaTable)
      .values({
        tenant_id: tenantId,
        nombre: data.nombre,
        contenido: data.contenido,
        ...(data.variables !== undefined ? { variables: data.variables } : {}),
        ...(data.meta_template_name !== undefined
          ? { meta_template_name: data.meta_template_name }
          : {}),
        created_by: userId,
      })
      .returning();
    if (!row) throw new Error("Error al crear plantilla");
    return {
      id: row.id,
      tenant_id: row.tenant_id,
      nombre: row.nombre,
      contenido: row.contenido,
      variables: (row.variables as string[] | null) ?? null,
      meta_template_name: row.meta_template_name ?? null,
      estado_meta: row.estado_meta,
      created_by: row.created_by ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async updatePlantilla(
    tenantId: string,
    id: string,
    data: UpdatePlantillaData
  ): Promise<CrmPlantilla | null> {
    const upd: Record<string, unknown> = { updated_at: new Date() };
    if (data.nombre !== undefined) upd.nombre = data.nombre;
    if (data.contenido !== undefined) upd.contenido = data.contenido;
    if (data.variables !== undefined) upd.variables = data.variables;
    if (data.meta_template_name !== undefined) upd.meta_template_name = data.meta_template_name;
    if (data.estado_meta !== undefined) upd.estado_meta = data.estado_meta;

    const rows = await this.db
      .update(crmPlantillaTable)
      .set(upd)
      .where(and(eq(crmPlantillaTable.id, id), eq(crmPlantillaTable.tenant_id, tenantId)))
      .returning({ id: crmPlantillaTable.id });
    if (rows.length === 0) return null;
    return this.findPlantillaById(tenantId, id);
  }

  // ─── Bots ──────────────────────────────────────────────────────────────────

  async listBots(tenantId: string): Promise<CrmBot[]> {
    const rows = await this.db
      .select()
      .from(crmBotTable)
      .where(eq(crmBotTable.tenant_id, tenantId))
      .orderBy(asc(crmBotTable.created_at));
    return rows.map((r) => ({
      id: r.id,
      tenant_id: r.tenant_id,
      nombre: r.nombre,
      codigo: r.codigo,
      tipo: r.tipo,
      config: r.config,
      activo: r.activo,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async findBotById(tenantId: string, id: string): Promise<CrmBot | null> {
    const rows = await this.db
      .select()
      .from(crmBotTable)
      .where(and(eq(crmBotTable.id, id), eq(crmBotTable.tenant_id, tenantId)))
      .limit(1);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      tenant_id: r.tenant_id,
      nombre: r.nombre,
      codigo: r.codigo,
      tipo: r.tipo,
      config: r.config,
      activo: r.activo,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  async updateBot(tenantId: string, id: string, data: UpdateBotData): Promise<CrmBot | null> {
    const upd: Record<string, unknown> = { updated_at: new Date() };
    if (data.activo !== undefined) upd.activo = data.activo;
    if (data.config !== undefined) upd.config = data.config;
    if (data.nombre !== undefined) upd.nombre = data.nombre;

    const rows = await this.db
      .update(crmBotTable)
      .set(upd)
      .where(and(eq(crmBotTable.id, id), eq(crmBotTable.tenant_id, tenantId)))
      .returning({ id: crmBotTable.id });
    if (rows.length === 0) return null;
    return this.findBotById(tenantId, id);
  }

  // ─── Agentes ───────────────────────────────────────────────────────────────

  async listAgentes(tenantId: string): Promise<CrmAgente[]> {
    const rows = await this.db
      .select()
      .from(crmAgenteTable)
      .where(eq(crmAgenteTable.tenant_id, tenantId))
      .orderBy(asc(crmAgenteTable.created_at));
    return rows.map((r) => ({
      id: r.id,
      tenant_id: r.tenant_id,
      nombre: r.nombre,
      canal: r.canal,
      modelo_ia: r.modelo_ia,
      tono: r.tono ?? null,
      prompt_base: r.prompt_base ?? null,
      max_mensajes_contexto: r.max_mensajes_contexto,
      activo: r.activo,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async updateAgente(
    tenantId: string,
    id: string,
    data: UpdateAgenteData
  ): Promise<CrmAgente | null> {
    const upd: Record<string, unknown> = { updated_at: new Date() };
    if (data.tono !== undefined) upd.tono = data.tono;
    if (data.prompt_base !== undefined) upd.prompt_base = data.prompt_base;
    if (data.max_mensajes_contexto !== undefined)
      upd.max_mensajes_contexto = data.max_mensajes_contexto;
    if (data.activo !== undefined) upd.activo = data.activo;

    const rows = await this.db
      .update(crmAgenteTable)
      .set(upd)
      .where(and(eq(crmAgenteTable.id, id), eq(crmAgenteTable.tenant_id, tenantId)))
      .returning({ id: crmAgenteTable.id });
    if (rows.length === 0) return null;

    const agentes = await this.listAgentes(tenantId);
    return agentes.find((a) => a.id === id) ?? null;
  }

  async listAccionesAgente(
    tenantId: string,
    agenteId: string,
    params: ListAccionesAgenteParams
  ): Promise<{ items: CrmAccionAgenteItem[]; total: number }> {
    const conds = [
      eq(crmAccionAgenteTable.tenant_id, tenantId),
      eq(crmAccionAgenteTable.agente_id, agenteId),
    ];
    if (params.fecha_desde)
      conds.push(gte(crmAccionAgenteTable.created_at, new Date(params.fecha_desde)));
    if (params.fecha_hasta)
      conds.push(lte(crmAccionAgenteTable.created_at, new Date(params.fecha_hasta)));
    if (params.tool_name) conds.push(eq(crmAccionAgenteTable.tool_name, params.tool_name));
    if (params.exitoso !== undefined) conds.push(eq(crmAccionAgenteTable.exitoso, params.exitoso));

    const offset = (params.page - 1) * params.pageSize;

    const items = await this.db
      .select()
      .from(crmAccionAgenteTable)
      .where(and(...conds))
      .orderBy(desc(crmAccionAgenteTable.created_at))
      .limit(params.pageSize)
      .offset(offset);

    const countRows = await this.db
      .select({ n: count() })
      .from(crmAccionAgenteTable)
      .where(and(...conds));

    const total = Number(countRows[0]?.n ?? 0);
    return {
      items: items.map((r) => ({
        id: r.id,
        agente_id: r.agente_id,
        conversacion_id: r.conversacion_id,
        lead_id: r.lead_id,
        tool_name: r.tool_name,
        tool_input: r.tool_input,
        tool_output: r.tool_output,
        exitoso: r.exitoso,
        duracion_ms: r.duracion_ms ?? null,
        error: r.error ?? null,
        created_at: r.created_at,
      })),
      total,
    };
  }

  // ─── Eventos ───────────────────────────────────────────────────────────────

  async listEventos(
    tenantId: string,
    params: ListEventosParams
  ): Promise<{ items: import("../../domain/entities/crm.js").CrmEvento[]; total: number }> {
    const conds = [eq(crmEventoTable.tenant_id, tenantId)];
    if (params.tipo) conds.push(eq(crmEventoTable.tipo, params.tipo));
    if (params.origen)
      conds.push(
        eq(crmEventoTable.origen, params.origen as "SISTEMA" | "NICO" | "VENDEDOR" | "BOT")
      );
    if (params.lead_id) conds.push(eq(crmEventoTable.lead_id, params.lead_id));
    if (params.fecha_desde)
      conds.push(gte(crmEventoTable.created_at, new Date(params.fecha_desde)));
    if (params.fecha_hasta)
      conds.push(lte(crmEventoTable.created_at, new Date(params.fecha_hasta)));

    const offset = (params.page - 1) * params.pageSize;

    const items = await this.db
      .select()
      .from(crmEventoTable)
      .where(and(...conds))
      .orderBy(desc(crmEventoTable.created_at))
      .limit(params.pageSize)
      .offset(offset);

    const countRows = await this.db
      .select({ n: count() })
      .from(crmEventoTable)
      .where(and(...conds));

    const total = Number(countRows[0]?.n ?? 0);
    return { items: items as unknown as import("../../domain/entities/crm.js").CrmEvento[], total };
  }

  // ─── Mensajería interna ────────────────────────────────────────────────────

  async listMensajeriaConversaciones(
    tenantId: string,
    userId: string,
    params: { page: number; pageSize: number }
  ): Promise<{ items: CrmConversacionInterna[]; total: number }> {
    const offset = (params.page - 1) * params.pageSize;

    // Obtener los IDs de usuarios con los que hay conversación
    const rows = await this.db.execute(sql`
      SELECT DISTINCT
        CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END AS usuario_id,
        u.nombres || ' ' || u.apellidos AS usuario_nombre,
        (SELECT mi2.contenido FROM crm_mensaje_interno mi2
         WHERE (mi2.remitente_id = ${userId}::uuid AND mi2.destinatario_id = CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END)
            OR (mi2.destinatario_id = ${userId}::uuid AND mi2.remitente_id = CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END)
         ORDER BY mi2.created_at DESC LIMIT 1) AS ultimo_mensaje,
        (SELECT mi3.created_at FROM crm_mensaje_interno mi3
         WHERE (mi3.remitente_id = ${userId}::uuid AND mi3.destinatario_id = CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END)
            OR (mi3.destinatario_id = ${userId}::uuid AND mi3.remitente_id = CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END)
         ORDER BY mi3.created_at DESC LIMIT 1) AS ultimo_at,
        COUNT(*) FILTER (WHERE m.destinatario_id = ${userId}::uuid AND m.leido = false) AS no_leidos
      FROM crm_mensaje_interno m
      JOIN usuario u ON u.id = CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END
      WHERE m.tenant_id = ${tenantId}::uuid
        AND (m.remitente_id = ${userId}::uuid OR m.destinatario_id = ${userId}::uuid)
      GROUP BY
        CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END,
        u.nombres, u.apellidos
      ORDER BY ultimo_at DESC NULLS LAST
      LIMIT ${params.pageSize} OFFSET ${offset}
    `);

    const countRows = await this.db.execute(sql`
      SELECT COUNT(DISTINCT CASE WHEN m.remitente_id = ${userId}::uuid THEN m.destinatario_id ELSE m.remitente_id END) AS total
      FROM crm_mensaje_interno m
      WHERE m.tenant_id = ${tenantId}::uuid
        AND (m.remitente_id = ${userId}::uuid OR m.destinatario_id = ${userId}::uuid)
    `);
    const total = Number((countRows[0] as Record<string, unknown>)?.total ?? 0);

    const items = (rows as unknown as Record<string, unknown>[]).map((r) => ({
      usuario_id: r.usuario_id as string,
      usuario_nombre: (r.usuario_nombre as string | null) ?? null,
      ultimo_mensaje: (r.ultimo_mensaje as string | null) ?? null,
      ultimo_at: r.ultimo_at ? new Date(r.ultimo_at as string) : null,
      no_leidos: Number(r.no_leidos ?? 0),
    }));

    return { items, total };
  }

  async listMensajesInternos(
    tenantId: string,
    userId: string,
    otroUsuarioId: string,
    params: { page: number; pageSize: number }
  ): Promise<{ items: CrmMensajeInterno[]; total: number }> {
    const offset = (params.page - 1) * params.pageSize;

    const rows = await this.db.execute(sql`
      SELECT m.id, m.tenant_id, m.remitente_id, m.destinatario_id, m.contenido, m.leido, m.created_at,
             ru.nombres || ' ' || ru.apellidos AS remitente_nombre,
             du.nombres || ' ' || du.apellidos AS destinatario_nombre
      FROM crm_mensaje_interno m
      JOIN usuario ru ON ru.id = m.remitente_id
      JOIN usuario du ON du.id = m.destinatario_id
      WHERE m.tenant_id = ${tenantId}::uuid
        AND (
          (m.remitente_id = ${userId}::uuid AND m.destinatario_id = ${otroUsuarioId}::uuid)
          OR
          (m.remitente_id = ${otroUsuarioId}::uuid AND m.destinatario_id = ${userId}::uuid)
        )
      ORDER BY m.created_at DESC
      LIMIT ${params.pageSize} OFFSET ${offset}
    `);

    const countRows = await this.db.execute(sql`
      SELECT COUNT(*)::int AS total
      FROM crm_mensaje_interno m
      WHERE m.tenant_id = ${tenantId}::uuid
        AND (
          (m.remitente_id = ${userId}::uuid AND m.destinatario_id = ${otroUsuarioId}::uuid)
          OR
          (m.remitente_id = ${otroUsuarioId}::uuid AND m.destinatario_id = ${userId}::uuid)
        )
    `);
    const total = Number((countRows[0] as Record<string, unknown>)?.total ?? 0);

    const items = (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      tenant_id: r.tenant_id as string,
      remitente_id: r.remitente_id as string,
      destinatario_id: r.destinatario_id as string,
      contenido: r.contenido as string,
      leido: r.leido as boolean,
      remitente_nombre: (r.remitente_nombre as string | null) ?? null,
      destinatario_nombre: (r.destinatario_nombre as string | null) ?? null,
      created_at: new Date(r.created_at as string),
    }));

    return { items, total };
  }

  async createMensajeInterno(
    tenantId: string,
    remitenteId: string,
    data: CreateMensajeInternoData
  ): Promise<CrmMensajeInterno> {
    const [row] = await this.db
      .insert(crmMensajeInternoTable)
      .values({
        tenant_id: tenantId,
        remitente_id: remitenteId,
        destinatario_id: data.destinatario_id,
        contenido: data.contenido,
      })
      .returning();
    if (!row) throw new Error("Error al crear mensaje interno");

    const full = await this.listMensajesInternos(tenantId, remitenteId, data.destinatario_id, {
      page: 1,
      pageSize: 1,
    });
    return (
      full.items[0] ?? {
        id: row.id,
        tenant_id: row.tenant_id,
        remitente_id: row.remitente_id,
        destinatario_id: row.destinatario_id,
        contenido: row.contenido,
        leido: row.leido,
        remitente_nombre: null,
        destinatario_nombre: null,
        created_at: row.created_at,
      }
    );
  }

  async marcarMensajeLeidoInterno(
    tenantId: string,
    mensajeId: string,
    destinatarioId: string
  ): Promise<boolean> {
    const rows = await this.db
      .update(crmMensajeInternoTable)
      .set({ leido: true })
      .where(
        and(
          eq(crmMensajeInternoTable.id, mensajeId),
          eq(crmMensajeInternoTable.tenant_id, tenantId),
          eq(crmMensajeInternoTable.destinatario_id, destinatarioId)
        )
      )
      .returning({ id: crmMensajeInternoTable.id });
    return rows.length > 0;
  }

  // ─── Métricas ──────────────────────────────────────────────────────────────

  async metricasDashboard(tenantId: string, from: string, to: string): Promise<MetricasDashboard> {
    const leadsActivosRows = await this.db.execute(sql`
      SELECT COUNT(*)::int AS total FROM crm_lead WHERE tenant_id = ${tenantId}::uuid AND activo = true
    `);
    const leads_activos = Number((leadsActivosRows[0] as Record<string, unknown>)?.total ?? 0);

    const porEtapaRows = await this.db.execute(sql`
      SELECT l.etapa_id, e.nombre AS etapa_nombre, COUNT(*)::int AS total
      FROM crm_lead l
      JOIN crm_etapa e ON l.etapa_id = e.id
      WHERE l.tenant_id = ${tenantId}::uuid AND l.activo = true
      GROUP BY l.etapa_id, e.nombre
    `);
    const leads_por_etapa = (porEtapaRows as unknown as Record<string, unknown>[]).map((r) => ({
      etapa_id: r.etapa_id as string,
      etapa_nombre: r.etapa_nombre as string,
      total: Number(r.total),
    }));

    const periodoRows = await this.db.execute(sql`
      SELECT COUNT(*)::int AS total FROM crm_lead
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
    `);
    const total_leads_periodo = Number((periodoRows[0] as Record<string, unknown>)?.total ?? 0);

    const convertidosRows = await this.db.execute(sql`
      SELECT COUNT(*)::int AS total FROM crm_lead l
      JOIN crm_etapa e ON l.etapa_id = e.id
      WHERE l.tenant_id = ${tenantId}::uuid AND e.codigo = 'CONVERTIDO'
        AND l.created_at >= ${from}::timestamptz AND l.created_at <= ${to}::timestamptz
    `);
    const convertidos = Number((convertidosRows[0] as Record<string, unknown>)?.total ?? 0);
    const tasa_conversion = total_leads_periodo > 0 ? convertidos / total_leads_periodo : 0;

    const tiempoRows = await this.db.execute(sql`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) / 60), 0) AS avg_min
      FROM crm_mensaje m1
      JOIN crm_mensaje m2 ON m2.conversacion_id = m1.conversacion_id
        AND m2.direccion = 'SALIENTE' AND m2.created_at > m1.created_at
      JOIN crm_conversacion c ON c.id = m1.conversacion_id
      WHERE c.tenant_id = ${tenantId}::uuid
        AND m1.direccion = 'ENTRANTE'
        AND m1.created_at >= ${from}::timestamptz AND m1.created_at <= ${to}::timestamptz
    `);
    const tiempo_promedio_respuesta_minutos = Number(
      (tiempoRows[0] as Record<string, unknown>)?.avg_min ?? 0
    );

    const utmRows = await this.db.execute(sql`
      SELECT COALESCE(utm_source, 'organic') AS canal, COUNT(*)::int AS total
      FROM crm_lead
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
      GROUP BY utm_source
    `);
    const leads_por_canal_utm = (utmRows as unknown as Record<string, unknown>[]).map((r) => ({
      canal: r.canal as string,
      total: Number(r.total),
    }));

    return {
      leads_activos,
      leads_por_etapa,
      tasa_conversion,
      tiempo_promedio_respuesta_minutos,
      total_leads_periodo,
      leads_por_canal_utm,
    };
  }

  async metricasNico(tenantId: string, from: string, to: string): Promise<MetricasNico> {
    const totalRows = await this.db.execute(sql`
      SELECT COUNT(*)::int AS total FROM crm_accion_agente
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
    `);
    const mensajes_procesados = Number((totalRows[0] as Record<string, unknown>)?.total ?? 0);

    const toolsRows = await this.db.execute(sql`
      SELECT tool_name AS tool, COUNT(*)::int AS total
      FROM crm_accion_agente
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
      GROUP BY tool_name ORDER BY total DESC
    `);
    const tools_usadas = (toolsRows as unknown as Record<string, unknown>[]).map((r) => ({
      tool: r.tool as string,
      total: Number(r.total),
    }));

    const exitosaRows = await this.db.execute(sql`
      SELECT COUNT(*)::int AS total FROM crm_accion_agente
      WHERE tenant_id = ${tenantId}::uuid AND exitoso = true
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
    `);
    const exitosas = Number((exitosaRows[0] as Record<string, unknown>)?.total ?? 0);
    const tasa_exito = mensajes_procesados > 0 ? exitosas / mensajes_procesados : 0;

    const tiempoRows = await this.db.execute(sql`
      SELECT COALESCE(AVG(duracion_ms), 0)::int AS avg_ms FROM crm_accion_agente
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
    `);
    const tiempo_promedio_respuesta_ms = Number(
      (tiempoRows[0] as Record<string, unknown>)?.avg_ms ?? 0
    );

    const erroresRows = await this.db.execute(sql`
      SELECT COALESCE(error, 'Error desconocido') AS error, COUNT(*)::int AS total
      FROM crm_accion_agente
      WHERE tenant_id = ${tenantId}::uuid AND exitoso = false
        AND created_at >= ${from}::timestamptz AND created_at <= ${to}::timestamptz
      GROUP BY error ORDER BY total DESC LIMIT 10
    `);
    const errores = (erroresRows as unknown as Record<string, unknown>[]).map((r) => ({
      error: r.error as string,
      total: Number(r.total),
    }));

    return { mensajes_procesados, tools_usadas, tasa_exito, tiempo_promedio_respuesta_ms, errores };
  }

  async metricasLeads(tenantId: string, from: string, to: string): Promise<MetricaLead[]> {
    const rows = await this.db.execute(sql`
      SELECT l.id, l.created_at AS fecha, e.codigo AS estado,
             (e.codigo = 'CONVERTIDO') AS convertido,
             CASE WHEN e.codigo = 'CONVERTIDO'
               THEN EXTRACT(DAY FROM (l.updated_at - l.created_at))::int
               ELSE NULL
             END AS dias_para_convertir,
             l.utm_source, l.utm_campaign, l.utm_medium
      FROM crm_lead l
      JOIN crm_etapa e ON l.etapa_id = e.id
      WHERE l.tenant_id = ${tenantId}::uuid
        AND l.created_at >= ${from}::timestamptz AND l.created_at <= ${to}::timestamptz
      ORDER BY l.created_at DESC
    `);
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      fecha: new Date(r.fecha as string),
      estado: r.estado as string,
      convertido: Boolean(r.convertido),
      dias_para_convertir: r.dias_para_convertir !== null ? Number(r.dias_para_convertir) : null,
      utm_source: (r.utm_source as string | null) ?? null,
      utm_campaign: (r.utm_campaign as string | null) ?? null,
      utm_medium: (r.utm_medium as string | null) ?? null,
    }));
  }

  async metricasClientes(tenantId: string, from: string, to: string): Promise<MetricasClientes> {
    const ticketRows = await this.db.execute(sql`
      SELECT COALESCE(AVG(v.total::numeric), 0) AS ticket_promedio,
             COALESCE(COUNT(v.id)::numeric / NULLIF(COUNT(DISTINCT v.cliente_id), 0), 0) AS frecuencia_compra,
             MAX(v.created_at) AS ultima_compra
      FROM venta v
      WHERE v.tenant_id = ${tenantId}::uuid
        AND v.estado_pago = 'COMPLETADA'
        AND v.created_at >= ${from}::timestamptz AND v.created_at <= ${to}::timestamptz
    `);
    const r = (ticketRows[0] as Record<string, unknown>) ?? {};

    const riesgoRows = await this.db.execute(sql`
      SELECT COUNT(DISTINCT cliente_id)::int AS riesgo
      FROM venta
      WHERE tenant_id = ${tenantId}::uuid AND estado_pago = 'COMPLETADA'
        AND cliente_id IS NOT NULL
        AND created_at < NOW() - INTERVAL '60 days'
        AND cliente_id NOT IN (
          SELECT DISTINCT cliente_id FROM venta
          WHERE tenant_id = ${tenantId}::uuid AND estado_pago = 'COMPLETADA'
            AND created_at >= NOW() - INTERVAL '60 days'
        )
    `);
    const riesgo_abandono = Number((riesgoRows[0] as Record<string, unknown>)?.riesgo ?? 0);

    return {
      ticket_promedio: Number(r.ticket_promedio ?? 0),
      frecuencia_compra: Number(r.frecuencia_compra ?? 0),
      ultima_compra: r.ultima_compra ? new Date(r.ultima_compra as string) : null,
      riesgo_abandono,
    };
  }

  async metricasVentas(tenantId: string, from: string, to: string): Promise<MetricasVentas> {
    const generalRows = await this.db.execute(sql`
      SELECT COALESCE(SUM(v.total::numeric), 0) AS ingresos_brutos,
             COUNT(*)::int AS total_transacciones
      FROM venta v
      WHERE v.tenant_id = ${tenantId}::uuid
        AND v.estado_pago = 'COMPLETADA'
        AND v.created_at >= ${from}::timestamptz AND v.created_at <= ${to}::timestamptz
    `);
    const g = (generalRows[0] as Record<string, unknown>) ?? {};

    const topRows = await this.db.execute(sql`
      SELECT p.nombre, SUM(vi.cantidad)::int AS cantidad, SUM(vi.precio_unitario * vi.cantidad)::numeric AS ingresos
      FROM venta_item vi
      JOIN venta v ON v.id = vi.venta_id
      LEFT JOIN producto p ON p.id = vi.producto_id
      WHERE v.tenant_id = ${tenantId}::uuid
        AND v.estado_pago = 'COMPLETADA'
        AND v.created_at >= ${from}::timestamptz AND v.created_at <= ${to}::timestamptz
        AND vi.tipo = 'PRODUCTO'
      GROUP BY p.nombre ORDER BY ingresos DESC LIMIT 10
    `);
    const top_productos = (topRows as unknown as Record<string, unknown>[]).map((r) => ({
      nombre: (r.nombre as string | null) ?? "Sin nombre",
      cantidad: Number(r.cantidad ?? 0),
      ingresos: Number(r.ingresos ?? 0),
    }));

    const canalRows = await this.db.execute(sql`
      SELECT COALESCE(os.canal::text, 'TIENDA') AS canal,
             SUM(v.total::numeric)::numeric AS ingresos
      FROM venta v
      LEFT JOIN orden_servicio os ON os.id = v.orden_servicio_id
      WHERE v.tenant_id = ${tenantId}::uuid
        AND v.estado_pago = 'COMPLETADA'
        AND v.created_at >= ${from}::timestamptz AND v.created_at <= ${to}::timestamptz
      GROUP BY os.canal
    `);
    const ingresos_por_canal = (canalRows as unknown as Record<string, unknown>[]).map((r) => ({
      canal: r.canal as string,
      ingresos: Number(r.ingresos ?? 0),
    }));

    return {
      ingresos_brutos: Number(g.ingresos_brutos ?? 0),
      total_transacciones: Number(g.total_transacciones ?? 0),
      top_productos,
      ingresos_por_canal,
    };
  }

  async listAudiencias(tenantId: string): Promise<Audiencia[]> {
    // Audiencias dinámicas predefinidas basadas en estado del lead
    const rows = await this.db.execute(sql`
      SELECT e.codigo AS id, e.nombre, e.objetivo AS criterio, COUNT(l.id)::int AS total_contactos
      FROM crm_etapa e
      LEFT JOIN crm_lead l ON l.etapa_id = e.id AND l.tenant_id = e.tenant_id AND l.activo = true
      WHERE e.tenant_id = ${tenantId}::uuid AND e.activo = true
      GROUP BY e.id, e.nombre, e.objetivo
      ORDER BY e.orden
    `);
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      nombre: r.nombre as string,
      criterio: (r.criterio as string | null) ?? "",
      total_contactos: Number(r.total_contactos ?? 0),
    }));
  }

  // ─── Bot engine helpers ────────────────────────────────────────────────────

  async getLastBotMessage(
    tenantId: string,
    conversacionId: string
  ): Promise<LastBotMessage | null> {
    const rows = await this.db
      .select({
        id: crmMensajeTable.id,
        metadata: crmMensajeTable.metadata,
        created_at: crmMensajeTable.created_at,
      })
      .from(crmMensajeTable)
      .where(
        and(
          eq(crmMensajeTable.conversacion_id, conversacionId),
          eq(crmMensajeTable.tenant_id, tenantId),
          eq(crmMensajeTable.origen, "BOT")
        )
      )
      .orderBy(desc(crmMensajeTable.created_at))
      .limit(1);

    if (!rows[0]) return null;
    return {
      id: rows[0].id,
      metadata: rows[0].metadata,
      created_at: rows[0].created_at,
    };
  }

  async consultarServiciosCliente(
    tenantId: string,
    clienteId: string
  ): Promise<ServicioClienteResult[]> {
    const rows = await this.db.execute(sql`
      SELECT os.codigo, os.estado, os.falla_ingreso, os.created_at
      FROM orden_servicio os
      JOIN instancia i ON i.id = os.instancia_id
      WHERE os.tenant_id = ${tenantId}::uuid
        AND i.cliente_id = ${clienteId}::uuid
        AND os.estado NOT IN ('ENTREGADO', 'CANCELADO')
      ORDER BY os.created_at DESC
      LIMIT 5
    `);
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      codigo: r.codigo as string,
      estado: r.estado as string,
      falla_ingreso: r.falla_ingreso as string,
      created_at: new Date(r.created_at as string),
    }));
  }

  async moverEtapaDesdeBot(tenantId: string, leadId: string, etapaCodigo: string): Promise<void> {
    const etapa = await this.findEtapaByCodigo(tenantId, etapaCodigo);
    if (!etapa) return;
    await this.db
      .update(crmLeadTable)
      .set({ etapa_id: etapa.id, updated_at: new Date() })
      .where(and(eq(crmLeadTable.id, leadId), eq(crmLeadTable.tenant_id, tenantId)));
  }

  async getBotesRecordatorio(tenantId: string): Promise<
    Array<{
      lead_id: string;
      conversacion_id: string;
      tiempo_espera_horas: number;
      max_intentos: number;
      wa_cuenta_id: string;
      celular: string;
    }>
  > {
    const rows = await this.db.execute(sql`
      SELECT l.id AS lead_id, c.id AS conversacion_id,
             e.tiempo_espera_horas, e.max_intentos_recordatorio AS max_intentos,
             c.wa_cuenta_id, c.celular
      FROM crm_lead l
      JOIN crm_etapa e ON l.etapa_id = e.id
      JOIN crm_bot b ON e.bot_id = b.id
      JOIN crm_conversacion c ON c.lead_id = l.id AND c.estado = 'ACTIVA'
      WHERE l.tenant_id = ${tenantId}::uuid
        AND l.activo = true
        AND b.tipo = 'RECORDATORIO'
        AND b.activo = true
    `);
    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      lead_id: r.lead_id as string,
      conversacion_id: r.conversacion_id as string,
      tiempo_espera_horas: Number(r.tiempo_espera_horas ?? 24),
      max_intentos: Number(r.max_intentos ?? 3),
      wa_cuenta_id: r.wa_cuenta_id as string,
      celular: r.celular as string,
    }));
  }

  async countEventosBotLead(tenantId: string, leadId: string): Promise<number> {
    const rows = await this.db
      .select({ n: count() })
      .from(crmEventoTable)
      .where(
        and(
          eq(crmEventoTable.tenant_id, tenantId),
          eq(crmEventoTable.lead_id, leadId),
          eq(crmEventoTable.tipo, "BOT_EJECUTADO")
        )
      );
    return Number(rows[0]?.n ?? 0);
  }

  async registrarEventoBot(
    tenantId: string,
    leadId: string,
    conversacionId: string,
    datos: unknown
  ): Promise<void> {
    await this.db.insert(crmEventoTable).values({
      tenant_id: tenantId,
      tipo: "BOT_EJECUTADO",
      origen: "BOT",
      lead_id: leadId,
      conversacion_id: conversacionId,
      datos: datos as Record<string, unknown>,
    });
  }
}
