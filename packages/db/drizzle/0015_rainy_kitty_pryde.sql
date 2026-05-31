CREATE TYPE "public"."estado_visita" AS ENUM('POR_VALIDAR', 'VALIDADA', 'ASIGNADA', 'EN_CAMINO', 'EN_SITIO', 'TERMINADA', 'CANCELADA');--> statement-breakpoint
CREATE TABLE "tarifa_distrito" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"distrito" varchar(100) NOT NULL,
	"provincia" varchar(100) DEFAULT 'Lima' NOT NULL,
	"tarifa" numeric(12, 2) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tarifa_distrito_tenant_distrito" UNIQUE("tenant_id","distrito")
);
--> statement-breakpoint
CREATE TABLE "visita_domicilio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"cliente_id" uuid NOT NULL,
	"direccion_id" uuid,
	"direccion_texto" varchar(255) NOT NULL,
	"distrito" varchar(100) NOT NULL,
	"tecnico_id" uuid,
	"fecha_programada" date NOT NULL,
	"hora_inicio" time,
	"hora_fin" time,
	"estado" "estado_visita" DEFAULT 'POR_VALIDAR' NOT NULL,
	"tarifa" numeric(12, 2) DEFAULT '0' NOT NULL,
	"motivo_visita" text,
	"diagnostico_campo" text,
	"orden_servicio_id" uuid,
	"venta_id" uuid,
	"motivo_cancelacion" text,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tarifa_distrito" ADD CONSTRAINT "tarifa_distrito_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ADD CONSTRAINT "visita_domicilio_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ADD CONSTRAINT "visita_domicilio_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ADD CONSTRAINT "visita_domicilio_direccion_id_cliente_direccion_id_fk" FOREIGN KEY ("direccion_id") REFERENCES "public"."cliente_direccion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ADD CONSTRAINT "visita_domicilio_tecnico_id_usuario_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ADD CONSTRAINT "visita_domicilio_orden_servicio_id_orden_servicio_id_fk" FOREIGN KEY ("orden_servicio_id") REFERENCES "public"."orden_servicio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visita_domicilio" ADD CONSTRAINT "visita_domicilio_venta_id_venta_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."venta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_tarifa_distrito_tenant" ON "tarifa_distrito" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_visita_domicilio_tenant_estado" ON "visita_domicilio" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_visita_domicilio_tenant_tecnico" ON "visita_domicilio" USING btree ("tenant_id","tecnico_id");--> statement-breakpoint
CREATE INDEX "idx_visita_domicilio_tenant_cliente" ON "visita_domicilio" USING btree ("tenant_id","cliente_id");--> statement-breakpoint
CREATE INDEX "idx_visita_domicilio_tenant_fecha" ON "visita_domicilio" USING btree ("tenant_id","fecha_programada");--> statement-breakpoint
CREATE INDEX "idx_visita_domicilio_codigo" ON "visita_domicilio" USING btree ("tenant_id","codigo");