-- RLS policies for catalog tables
-- Same pattern as 0001_rls_policies.sql: NULLIF handles RESET case (empty string → NULL)
ALTER TABLE "categoria" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categoria" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "componente" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "componente" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marca" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "marca" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "modelo" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "modelo" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "categoria_isolation" ON "categoria"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "componente_isolation" ON "componente"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "marca_isolation" ON "marca"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "modelo_isolation" ON "modelo"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
