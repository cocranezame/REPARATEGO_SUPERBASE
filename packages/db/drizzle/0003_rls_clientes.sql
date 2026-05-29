-- RLS policies for client tables
-- Same pattern as 0001_rls_policies.sql / 0002_rls_catalogos.sql: NULLIF handles RESET case (empty string → NULL)
ALTER TABLE "cliente" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cliente" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cliente_direccion" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cliente_direccion" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "cliente_isolation" ON "cliente"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "cliente_direccion_isolation" ON "cliente_direccion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
