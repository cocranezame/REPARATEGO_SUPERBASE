ALTER TABLE "tarifa_distrito" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tarifa_distrito_tenant_isolation" ON "tarifa_distrito"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "visita_domicilio_tenant_isolation" ON "visita_domicilio"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
