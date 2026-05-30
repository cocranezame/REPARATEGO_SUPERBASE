ALTER TABLE "producto" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "producto" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "producto_compatibilidad" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "producto_compatibilidad" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasa_precio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasa_precio" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "metodo_pago_catalogo" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "metodo_pago_catalogo" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lote" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lote" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "producto_isolation" ON "producto"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "producto_compatibilidad_isolation" ON "producto_compatibilidad"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tasa_precio_isolation" ON "tasa_precio"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "metodo_pago_catalogo_isolation" ON "metodo_pago_catalogo"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "lote_isolation" ON "lote"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "movimiento_inventario_isolation" ON "movimiento_inventario"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
