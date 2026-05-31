ALTER TABLE "caja" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venta_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venta_pago" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "venta_envio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cotizacion_venta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cotizacion_venta_item" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "caja_tenant_isolation" ON "caja"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "venta_tenant_isolation" ON "venta"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "venta_item_tenant_isolation" ON "venta_item"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "venta_pago_tenant_isolation" ON "venta_pago"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "venta_envio_tenant_isolation" ON "venta_envio"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "cotizacion_venta_tenant_isolation" ON "cotizacion_venta"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "cotizacion_venta_item_tenant_isolation" ON "cotizacion_venta_item"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
