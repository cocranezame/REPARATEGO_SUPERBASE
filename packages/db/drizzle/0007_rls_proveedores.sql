ALTER TABLE "proveedor" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor_contacto" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor_contacto" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor_metodo_pago" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor_metodo_pago" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor_linea" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "proveedor_linea" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "proveedor_isolation" ON "proveedor"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "proveedor_contacto_isolation" ON "proveedor_contacto"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "proveedor_metodo_pago_isolation" ON "proveedor_metodo_pago"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "proveedor_linea_isolation" ON "proveedor_linea"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
