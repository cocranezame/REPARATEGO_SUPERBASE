import type { MetricasQuery } from "@kallpasoft/validators";
import type { Context } from "hono";
import type { HonoVariables } from "../../../../types/context.js";
import type { ICrmRepository } from "../../domain/ports/crm.repository.js";

// biome-ignore lint/suspicious/noExplicitAny: Hono Context Input generic
type HonoCtx = Context<{ Variables: HonoVariables }, string, any>;

export class MetricasHandler {
  constructor(private readonly repo: ICrmRepository) {}

  dashboard = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as MetricasQuery;
    const data = await this.repo.metricasDashboard(tenantId, query.from, query.to);
    return c.json({ success: true, data });
  };

  nico = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as MetricasQuery;
    const data = await this.repo.metricasNico(tenantId, query.from, query.to);
    return c.json({ success: true, data });
  };

  leads = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as MetricasQuery;
    const data = await this.repo.metricasLeads(tenantId, query.from, query.to);
    return c.json({ success: true, data });
  };

  clientes = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as MetricasQuery;
    const data = await this.repo.metricasClientes(tenantId, query.from, query.to);
    return c.json({ success: true, data });
  };

  ventas = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const query = c.req.valid("query") as MetricasQuery;
    const data = await this.repo.metricasVentas(tenantId, query.from, query.to);
    return c.json({ success: true, data });
  };

  audiencias = async (c: HonoCtx) => {
    const tenantId = c.get("tenantId");
    const data = await this.repo.listAudiencias(tenantId);
    return c.json({ success: true, data });
  };
}
