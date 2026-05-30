CREATE TYPE "public"."prioridad_solicitud" AS ENUM('BAJA', 'NORMAL', 'ALTA', 'URGENTE');--> statement-breakpoint
CREATE TYPE "public"."estado_solicitud_compra" AS ENUM('PENDIENTE', 'EN_OC', 'COMPLETADA');--> statement-breakpoint
CREATE TYPE "public"."estado_orden_compra" AS ENUM('GENERADA', 'ENVIADA', 'TERMINADA', 'INGRESADA', 'PENDIENTE_PAGO');--> statement-breakpoint
CREATE TABLE "orden_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"proveedor_id" uuid NOT NULL,
	"estado" "estado_orden_compra" DEFAULT 'GENERADA' NOT NULL,
	"fecha_emision" date NOT NULL,
	"fecha_entrega_estimada" date,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"igv" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notas" text,
	"usuario_id" uuid NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solicitud_compra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"cantidad_solicitada" integer NOT NULL,
	"prioridad" "prioridad_solicitud" DEFAULT 'NORMAL' NOT NULL,
	"estado" "estado_solicitud_compra" DEFAULT 'PENDIENTE' NOT NULL,
	"orden_compra_id" uuid,
	"usuario_id" uuid NOT NULL,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orden_compra_confirmacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"orden_compra_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"cantidad_ordenada" integer NOT NULL,
	"cantidad_recibida" integer DEFAULT 0 NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"conforme" boolean,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orden_compra" ADD CONSTRAINT "orden_compra_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_compra" ADD CONSTRAINT "orden_compra_proveedor_id_proveedor_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."proveedor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_compra" ADD CONSTRAINT "orden_compra_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitud_compra" ADD CONSTRAINT "solicitud_compra_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitud_compra" ADD CONSTRAINT "solicitud_compra_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitud_compra" ADD CONSTRAINT "solicitud_compra_orden_compra_id_orden_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."orden_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitud_compra" ADD CONSTRAINT "solicitud_compra_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_compra_confirmacion" ADD CONSTRAINT "orden_compra_confirmacion_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_compra_confirmacion" ADD CONSTRAINT "orden_compra_confirmacion_orden_compra_id_orden_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."orden_compra"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_compra_confirmacion" ADD CONSTRAINT "orden_compra_confirmacion_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_orden_compra_tenant_estado" ON "orden_compra" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_orden_compra_tenant_proveedor" ON "orden_compra" USING btree ("tenant_id","proveedor_id");--> statement-breakpoint
CREATE INDEX "idx_solicitud_compra_tenant_estado" ON "solicitud_compra" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_solicitud_compra_tenant_producto" ON "solicitud_compra" USING btree ("tenant_id","producto_id");--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_orden_compra_id_orden_compra_id_fk" FOREIGN KEY ("orden_compra_id") REFERENCES "public"."orden_compra"("id") ON DELETE no action ON UPDATE no action;
