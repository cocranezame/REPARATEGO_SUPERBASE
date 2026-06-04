import type { DbClient } from "@kallpasoft/db";
import {
  categoria as categoriaTable,
  cliente as clienteTable,
  instanciaImagen as instanciaImagenTable,
  instancia as instanciaTable,
  marca as marcaTable,
  ordenServicioAceptacion as osAceptacionTable,
  ordenServicioCotizacion as osCotizacionTable,
  ordenServicioEvidencia as osEvidenciaTable,
  ordenServicio as osTable,
  producto as productoTable,
  sucursal as sucursalTable,
  venta as ventaTable,
} from "@kallpasoft/db";
import { and, count, desc, eq, or, sql } from "drizzle-orm";
import type {
  PortalCliente,
  PortalCotizacionItem,
  PortalEvidencia,
  PortalInstancia,
  PortalInstanciaImagen,
  PortalServicio,
} from "../../domain/entities/portal.js";
import type {
  IPortalRepository,
  PortalAceptarPresupuestoData,
  PortalAceptarValidacionData,
} from "../../domain/ports/portal.repository.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// biome-ignore lint/suspicious/noExplicitAny: Drizzle PgTransaction type is deeply generic
async function setTenantLocal(tx: any, tenantId: string): Promise<void> {
  if (UUID_RE.test(tenantId)) {
    await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
  }
}

const ESTADOS_CON_COTIZACION = [
  "COTIZADO",
  "APROBADO",
  "AGREGAR_SKU",
  "PRIORIDAD",
  "REPARADO",
  "AVISADO",
  "ENTREGADO",
  "DEVOLUCION",
] as const;

const ESTADOS_LISTO = ["REPARADO", "AVISADO"] as const;

export class PortalDrizzleRepository implements IPortalRepository {
  constructor(private readonly db: DbClient) {}

  async loginByDocCelular(
    tenantId: string,
    numerDoc: string,
    celular: string
  ): Promise<PortalCliente | null> {
    const rows = await this.db
      .select({
        id: clienteTable.id,
        nombres: clienteTable.nombres,
        apellidos: clienteTable.apellidos,
        razon_social: clienteTable.razon_social,
        numero_documento: clienteTable.numero_documento,
      })
      .from(clienteTable)
      .where(
        and(
          eq(clienteTable.tenant_id, tenantId),
          eq(clienteTable.numero_documento, numerDoc),
          eq(clienteTable.activo, true),
          or(eq(clienteTable.telefono, celular), eq(clienteTable.telefono_secundario, celular))
        )
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const nombre =
      row.razon_social ??
      (`${row.nombres ?? ""} ${row.apellidos ?? ""}`.trim() || row.numero_documento);

    return { id: row.id, nombre, numero_documento: row.numero_documento };
  }

  async listInstancias(tenantId: string, clienteId: string): Promise<PortalInstancia[]> {
    const instRows = await this.db
      .select({
        inst: instanciaTable,
        prod_nombre: productoTable.nombre,
        cat_nombre: categoriaTable.nombre,
        marca_nombre: marcaTable.nombre,
      })
      .from(instanciaTable)
      .leftJoin(productoTable, eq(productoTable.id, instanciaTable.producto_id))
      .leftJoin(categoriaTable, eq(categoriaTable.id, productoTable.categoria_id))
      .leftJoin(marcaTable, eq(marcaTable.id, productoTable.marca_id))
      .where(
        and(
          eq(instanciaTable.tenant_id, tenantId),
          eq(instanciaTable.cliente_id, clienteId),
          eq(instanciaTable.activo, true)
        )
      )
      .orderBy(desc(instanciaTable.created_at));

    const result: PortalInstancia[] = [];

    for (const r of instRows) {
      const inst = r.inst as typeof instanciaTable.$inferSelect;

      const imgRows = await this.db
        .select({
          id: instanciaImagenTable.id,
          url: instanciaImagenTable.url,
          descripcion: instanciaImagenTable.descripcion,
        })
        .from(instanciaImagenTable)
        .where(eq(instanciaImagenTable.instancia_id, inst.id))
        .orderBy(instanciaImagenTable.orden);

      const imagenes: PortalInstanciaImagen[] = imgRows.map((img) => ({
        id: img.id,
        url: img.url,
        ...(img.descripcion != null ? { descripcion: img.descripcion } : {}),
      }));

      // Get most recent active service (excluding terminal states)
      const osRows = await this.db
        .select({ id: osTable.id, codigo: osTable.codigo, estado: osTable.estado })
        .from(osTable)
        .where(
          and(
            eq(osTable.tenant_id, tenantId),
            eq(osTable.instancia_id, inst.id),
            eq(osTable.activo, true)
          )
        )
        .orderBy(desc(osTable.created_at))
        .limit(1);

      const osRow = osRows[0] as typeof osTable.$inferSelect | undefined;
      const servicio_activo =
        osRow && osRow.estado !== "ENTREGADO" && osRow.estado !== "DEVOLUCION"
          ? { id: osRow.id, codigo: osRow.codigo, estado: osRow.estado }
          : undefined;

      result.push({
        id: inst.id,
        producto_id: inst.producto_id,
        ...(r.prod_nombre != null ? { producto_nombre: r.prod_nombre } : {}),
        ...(r.cat_nombre != null ? { categoria_nombre: r.cat_nombre } : {}),
        ...(r.marca_nombre != null ? { marca_nombre: r.marca_nombre } : {}),
        ...(inst.numero_serie != null ? { numero_serie: inst.numero_serie } : {}),
        imagenes,
        ...(servicio_activo !== undefined ? { servicio_activo } : {}),
      });
    }

    return result;
  }

  async getServicio(
    tenantId: string,
    ordenId: string,
    clienteId: string
  ): Promise<PortalServicio | null> {
    const osRows = await this.db
      .select({
        os: osTable,
        inst: instanciaTable,
        prod_nombre: productoTable.nombre,
        cat_nombre: categoriaTable.nombre,
        marca_nombre: marcaTable.nombre,
        suc_nombre: sucursalTable.nombre,
        suc_dir: sucursalTable.direccion,
        suc_dist: sucursalTable.distrito,
        suc_tel: sucursalTable.telefono,
        cli_nombres: clienteTable.nombres,
        cli_apellidos: clienteTable.apellidos,
        cli_razon: clienteTable.razon_social,
      })
      .from(osTable)
      .innerJoin(instanciaTable, eq(instanciaTable.id, osTable.instancia_id))
      .leftJoin(productoTable, eq(productoTable.id, instanciaTable.producto_id))
      .leftJoin(categoriaTable, eq(categoriaTable.id, productoTable.categoria_id))
      .leftJoin(marcaTable, eq(marcaTable.id, productoTable.marca_id))
      .leftJoin(sucursalTable, eq(sucursalTable.id, osTable.sucursal_id))
      .innerJoin(clienteTable, eq(clienteTable.id, instanciaTable.cliente_id))
      .where(
        and(
          eq(osTable.id, ordenId),
          eq(osTable.tenant_id, tenantId),
          eq(instanciaTable.cliente_id, clienteId)
        )
      )
      .limit(1);

    const row = osRows[0];
    if (!row) return null;

    const os = row.os as typeof osTable.$inferSelect;
    const inst = row.inst as typeof instanciaTable.$inferSelect;
    const estado = os.estado;

    const imgRows = await this.db
      .select({
        id: instanciaImagenTable.id,
        url: instanciaImagenTable.url,
        descripcion: instanciaImagenTable.descripcion,
      })
      .from(instanciaImagenTable)
      .where(eq(instanciaImagenTable.instancia_id, inst.id))
      .orderBy(instanciaImagenTable.orden);

    const imagenes_instancia: PortalInstanciaImagen[] = imgRows.map((img) => ({
      id: img.id,
      url: img.url,
      ...(img.descripcion != null ? { descripcion: img.descripcion } : {}),
    }));

    const cliente_nombre =
      row.cli_razon ?? (`${row.cli_nombres ?? ""} ${row.cli_apellidos ?? ""}`.trim() || undefined);

    const mostrarCotizacion = (ESTADOS_CON_COTIZACION as readonly string[]).includes(estado);
    const mostrarSucursal = (ESTADOS_LISTO as readonly string[]).includes(estado);

    let evidencias: PortalEvidencia[] = [];
    let cotizacion: PortalServicio["cotizacion"];

    if (mostrarCotizacion) {
      const evRows = await this.db
        .select({
          id: osEvidenciaTable.id,
          url: osEvidenciaTable.url,
          descripcion: osEvidenciaTable.descripcion,
        })
        .from(osEvidenciaTable)
        .where(eq(osEvidenciaTable.orden_servicio_id, ordenId))
        .orderBy(osEvidenciaTable.created_at);

      evidencias = evRows.map((ev) => ({
        id: ev.id,
        url: ev.url,
        ...(ev.descripcion != null ? { descripcion: ev.descripcion } : {}),
      }));

      const cotRows = await this.db
        .select()
        .from(osCotizacionTable)
        .where(eq(osCotizacionTable.orden_servicio_id, ordenId))
        .orderBy(osCotizacionTable.created_at);

      if (cotRows.length > 0) {
        let totalCorr = 0;
        let totalPrev = 0;

        const items: PortalCotizacionItem[] = cotRows.map((cot) => {
          const item = cot as typeof osCotizacionTable.$inferSelect;
          const desc = item.descripcion_manual ?? "Repuesto/Servicio";
          const subtotalNum = Number(item.subtotal);

          if (item.es_preventivo) totalPrev += subtotalNum;
          else totalCorr += subtotalNum;

          return {
            id: item.id,
            descripcion: desc,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
            es_preventivo: item.es_preventivo,
          };
        });

        cotizacion = {
          items,
          total_correctivo: totalCorr.toFixed(2),
          total_preventivo: totalPrev.toFixed(2),
          total: (totalCorr + totalPrev).toFixed(2),
        };
      }
    }

    let sucursal: PortalServicio["sucursal"];
    if (mostrarSucursal && row.suc_nombre != null) {
      sucursal = {
        nombre: row.suc_nombre,
        ...(row.suc_dir != null ? { direccion: row.suc_dir } : {}),
        ...(row.suc_dist != null ? { distrito: row.suc_dist } : {}),
        ...(row.suc_tel != null ? { telefono: row.suc_tel } : {}),
      };
    }

    let venta_estado: string | undefined;
    if (os.venta_id) {
      const vRows = await this.db
        .select({ estado: ventaTable.estado_pago })
        .from(ventaTable)
        .where(eq(ventaTable.id, os.venta_id))
        .limit(1);
      venta_estado = vRows[0]?.estado ?? undefined;
    }

    return {
      id: os.id,
      codigo: os.codigo,
      estado,
      falla_ingreso: os.falla_ingreso,
      costo_revision: os.costo_revision,
      canal: os.canal,
      created_at: os.created_at,
      updated_at: os.updated_at,
      ...(cliente_nombre !== undefined ? { cliente_nombre } : {}),
      instancia_id: inst.id,
      ...(row.prod_nombre != null ? { producto_nombre: row.prod_nombre } : {}),
      ...(row.cat_nombre != null ? { categoria_nombre: row.cat_nombre } : {}),
      ...(row.marca_nombre != null ? { marca_nombre: row.marca_nombre } : {}),
      ...(inst.numero_serie != null ? { numero_serie: inst.numero_serie } : {}),
      imagenes_instancia,
      ...(mostrarCotizacion && os.diagnostico_tecnico != null
        ? { diagnostico_tecnico: os.diagnostico_tecnico }
        : {}),
      ...(mostrarCotizacion && os.solucion != null ? { solucion: os.solucion } : {}),
      evidencias,
      ...(cotizacion !== undefined ? { cotizacion } : {}),
      ...(sucursal !== undefined ? { sucursal } : {}),
      ...(venta_estado !== undefined ? { venta_estado } : {}),
      ...(os.motivo_devolucion != null ? { motivo_devolucion: os.motivo_devolucion } : {}),
      ...(os.preventivo_accepted != null ? { preventivo_accepted: os.preventivo_accepted } : {}),
    };
  }

  async aceptarValidacion(
    tenantId: string,
    ordenId: string,
    clienteId: string,
    data: PortalAceptarValidacionData
  ): Promise<{ estado_nuevo: string }> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const osRows = await tx
        .select({ estado: osTable.estado, instancia_id: osTable.instancia_id })
        .from(osTable)
        .innerJoin(instanciaTable, eq(instanciaTable.id, osTable.instancia_id))
        .where(
          and(
            eq(osTable.id, ordenId),
            eq(osTable.tenant_id, tenantId),
            eq(instanciaTable.cliente_id, clienteId)
          )
        )
        .limit(1);

      const os = osRows[0] as (typeof osTable.$inferSelect & { instancia_id: string }) | undefined;
      if (!os) throw new Error("Orden no encontrada o no pertenece al cliente");
      if (os.estado !== "VALIDACION") throw new Error("La orden no está en estado VALIDACION");

      // R1: check at least 1 image
      const imgCount = await tx
        .select({ total: count() })
        .from(instanciaImagenTable)
        .where(eq(instanciaImagenTable.instancia_id, os.instancia_id));

      if ((imgCount[0]?.total ?? 0) === 0) {
        throw new Error("R1: La instancia debe tener al menos 1 imagen antes de validar");
      }

      await tx.insert(osAceptacionTable).values({
        tenant_id: tenantId,
        orden_servicio_id: ordenId,
        tipo: "VALIDACION",
        canal_aceptacion: "PORTAL_CLIENTE",
        accepted_at: new Date(),
        metodo_aceptacion: "CLICK_BUTTON",
        documento_version: data.documento_version,
        texto_mostrado: data.texto_mostrado,
        ...(data.ip_address !== undefined ? { ip_address: data.ip_address } : {}),
      });

      await tx
        .update(osTable)
        .set({ estado: "REVISION", updated_at: new Date() })
        .where(eq(osTable.id, ordenId));

      return { estado_nuevo: "REVISION" };
    });
  }

  async aceptarPresupuesto(
    tenantId: string,
    ordenId: string,
    clienteId: string,
    data: PortalAceptarPresupuestoData
  ): Promise<{ estado_nuevo: string }> {
    return this.db.transaction(async (tx) => {
      await setTenantLocal(tx, tenantId);

      const osRows = await tx
        .select({ estado: osTable.estado })
        .from(osTable)
        .innerJoin(instanciaTable, eq(instanciaTable.id, osTable.instancia_id))
        .where(
          and(
            eq(osTable.id, ordenId),
            eq(osTable.tenant_id, tenantId),
            eq(instanciaTable.cliente_id, clienteId)
          )
        )
        .limit(1);

      const os = osRows[0] as typeof osTable.$inferSelect | undefined;
      if (!os) throw new Error("Orden no encontrada o no pertenece al cliente");
      if (os.estado !== "COTIZADO") throw new Error("La orden no está en estado COTIZADO");

      await tx.insert(osAceptacionTable).values({
        tenant_id: tenantId,
        orden_servicio_id: ordenId,
        tipo: "PRESUPUESTO",
        canal_aceptacion: "PORTAL_CLIENTE",
        accepted_at: new Date(),
        metodo_aceptacion: "CLICK_BUTTON",
        documento_version: data.documento_version,
        texto_mostrado: data.texto_mostrado,
        preventivo_accepted: data.preventivo_accepted,
        ...(data.ip_address !== undefined ? { ip_address: data.ip_address } : {}),
      });

      await tx
        .update(osTable)
        .set({
          estado: "APROBADO",
          preventivo_accepted: data.preventivo_accepted,
          updated_at: new Date(),
        })
        .where(eq(osTable.id, ordenId));

      return { estado_nuevo: "APROBADO" };
    });
  }
}
