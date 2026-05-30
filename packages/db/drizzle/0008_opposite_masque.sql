CREATE TYPE "public"."estado_cotizacion_compra" AS ENUM('PENDIENTE', 'COTIZADA', 'VENCIDA');--> statement-breakpoint
CREATE TABLE "cotizacion_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"estado" "estado_cotizacion_compra" DEFAULT 'PENDIENTE' NOT NULL,
	"fecha_solicitud" date NOT NULL,
	"fecha_respuesta" date,
	"fecha_vencimiento" date,
	"notas" text,
	"usuario_id" uuid NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotizacion_compra_detalle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cotizacion_compra_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(12, 2),
	"subtotal" numeric(12, 2),
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cotizacion_compra" ADD CONSTRAINT "cotizacion_compra_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_compra" ADD CONSTRAINT "cotizacion_compra_proveedor_id_proveedor_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_compra" ADD CONSTRAINT "cotizacion_compra_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_compra_detalle" ADD CONSTRAINT "cotizacion_compra_detalle_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_compra_detalle" ADD CONSTRAINT "cotizacion_compra_detalle_cotizacion_compra_id_cotizacion_compra_id_fk" FOREIGN KEY ("cotizacion_compra_id") REFERENCES "public"."cotizacion_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_compra_detalle" ADD CONSTRAINT "cotizacion_compra_detalle_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cotizacion_compra_tenant_estado" ON "cotizacion_compra" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_cotizacion_compra_proveedor" ON "cotizacion_compra" USING btree ("tenant_id","proveedor_id");