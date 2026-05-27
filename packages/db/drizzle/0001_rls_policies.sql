-- RLS policies for security tables
-- Local: current_setting('app.tenant_id', true) — API sets via SET LOCAL before each query
-- NULLIF handles RESET case (empty string → NULL) so cast to uuid never fails
-- Production (Supabase): replaced by auth.jwt() ->> 'tenant_id' (see ADR-004)
ALTER TABLE "tenant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tenant" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sucursal" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sucursal" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usuario" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usuario" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "feature_flag" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "feature_flag" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "tenant"
  USING (id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "sucursal_isolation" ON "sucursal"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "usuario_isolation" ON "usuario"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "feature_flag_isolation" ON "feature_flag"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
