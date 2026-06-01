/**
 * Funciones de integración interna para que el módulo de servicios pueda
 * operar ventas sin pasar por HTTP (llamadas in-process).
 *
 * V23: En COTIZADO/APROBADO → crear venta tipo SERVICIO con items del presupuesto
 * V24: En AGREGAR_SKU → precargar SKUs en la venta existente
 * V25: En AVISADO "Cobrar" → abrir POS con la venta existente (solo lectura: GET /ventas/:id)
 * V26: En DEVOLUCIÓN → crear venta tipo REVISION_DEVOLUCION (usa POST /ventas normal)
 *
 * Uso desde servicios:
 *   import { ventaIntegration } from "../../ventas/http/internal.js";
 *   await ventaIntegration.crearVentaServicio(tenantId, ordenServicioId, cajaId, items, createdBy);
 */
import { getDb } from "../../../lib/db.js";
import type { CreateVentaData, CreateVentaItemData } from "../domain/ports/venta.repository.js";
import { VentaDrizzleRepository } from "../infra/repositories/venta.drizzle.js";

const repo = new VentaDrizzleRepository(getDb());

export const ventaIntegration = {
  async crearVentaServicio(
    tenantId: string,
    cajaId: string,
    ordenServicioId: string,
    items: CreateVentaItemData[],
    createdBy: string
  ) {
    const data: CreateVentaData = {
      caja_id: cajaId,
      tipo: "SERVICIO",
      orden_servicio_id: ordenServicioId,
      items,
      created_by: createdBy,
    };
    return repo.crearVentaDesdeServicio(tenantId, data);
  },

  async actualizarSkus(tenantId: string, ventaId: string, items: CreateVentaItemData[]) {
    return repo.actualizarItemsConSkus(tenantId, ventaId, items);
  },
};
