ALTER TABLE "cotizacion_compra" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cotizacion_compra" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cotizacion_compra_detalle" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cotizacion_compra_detalle" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "cotizacion_compra_isolation" ON "cotizacion_compra"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "cotizacion_compra_detalle_isolation" ON "cotizacion_compra_detalle"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
