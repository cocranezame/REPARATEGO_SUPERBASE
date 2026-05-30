CREATE TYPE "public"."metodo_pago_proveedor" AS ENUM('TRANSFERENCIA', 'EFECTIVO', 'CHEQUE');--> statement-breakpoint
CREATE TABLE "pago_proveedor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"orden_compra_id" uuid NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"metodo_pago" "metodo_pago_proveedor" NOT NULL,
	"referencia" varchar(100),
	"comprobante_url" varchar(500),
	"fecha_pago" date NOT NULL,
	"notas" text,
	"usuario_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pago_proveedor" ADD CONSTRAINT "pago_proveedor_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago_proveedor" ADD CONSTRAINT "pago_proveedor_orden_compra_id_orden_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."orden_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago_proveedor" ADD CONSTRAINT "pago_proveedor_proveedor_id_proveedor_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pago_proveedor" ADD CONSTRAINT "pago_proveedor_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pago_proveedor_tenant" ON "pago_proveedor" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_pago_proveedor_orden_compra" ON "pago_proveedor" USING btree ("orden_compra_id");--> statement-breakpoint
CREATE INDEX "idx_pago_proveedor_proveedor" ON "pago_proveedor" USING btree ("tenant_id","proveedor_id");--> statement-breakpoint
ALTER TABLE "pago_proveedor" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "pago_proveedor_tenant_isolation" ON "pago_proveedor"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
