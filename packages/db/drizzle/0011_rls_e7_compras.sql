ALTER TABLE "orden_compra" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orden_compra" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "solicitud_compra" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "solicitud_compra" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orden_compra_confirmacion" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orden_compra_confirmacion" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "orden_compra_isolation" ON "orden_compra"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "solicitud_compra_isolation" ON "solicitud_compra"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "orden_compra_confirmacion_isolation" ON "orden_compra_confirmacion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
