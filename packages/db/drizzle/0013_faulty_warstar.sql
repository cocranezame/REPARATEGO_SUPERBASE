CREATE TYPE "public"."estado_orden_servicio" AS ENUM('RECEPCION', 'EN_DIAGNOSTICO', 'DIAGNOSTICADO', 'COTIZADO', 'APROBADO', 'EN_REPARACION', 'REPARADO', 'LISTO_ENTREGA', 'ENTREGADO', 'DEVOLUCION', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."momento_evidencia" AS ENUM('RECEPCION', 'DIAGNOSTICO', 'REPARACION', 'ENTREGA');--> statement-breakpoint
CREATE TYPE "public"."tipo_servicio" AS ENUM('CORRECTIVO', 'PREVENTIVO');--> statement-breakpoint
CREATE TABLE "orden_servicio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"sucursal_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"tecnico_id" uuid,
	"recibido_por_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"marca_id" uuid,
	"modelo_id" uuid,
	"serie_equipo" varchar(50),
	"color_equipo" varchar(30),
	"estado" "estado_orden_servicio" DEFAULT 'RECEPCION' NOT NULL,
	"problema_reportado" text NOT NULL,
	"diagnostico_tecnico" text,
	"solucion_aplicada" text,
	"tipo_servicio" "tipo_servicio" DEFAULT 'CORRECTIVO' NOT NULL,
	"fecha_recepcion" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_diagnostico" timestamp with time zone,
	"fecha_inicio_reparacion" timestamp with time zone,
	"fecha_terminado" timestamp with time zone,
	"fecha_entrega" timestamp with time zone,
	"prioridad" varchar(10) DEFAULT 'NORMAL' NOT NULL,
	"visita_domicilio_id" uuid,
	"notas_internas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orden_servicio_componente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"orden_servicio_id" uuid NOT NULL,
	"componente_id" uuid NOT NULL,
	"es_preliminar" boolean DEFAULT true NOT NULL,
	"estado_componente" varchar(20) NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orden_servicio_cotizacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"orden_servicio_id" uuid NOT NULL,
	"producto_id" uuid,
	"descripcion" varchar(200) NOT NULL,
	"cantidad" integer DEFAULT 1 NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tipo" varchar(15) NOT NULL,
	"aprobado_cliente" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orden_servicio_evidencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"orden_servicio_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"tipo_archivo" varchar(10) NOT NULL,
	"momento" "momento_evidencia" NOT NULL,
	"descripcion" varchar(200),
	"usuario_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_tecnico_id_usuario_id_fk" FOREIGN KEY ("tecnico_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_recibido_por_id_usuario_id_fk" FOREIGN KEY ("recibido_por_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio" ADD CONSTRAINT "orden_servicio_modelo_id_modelo_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_componente" ADD CONSTRAINT "orden_servicio_componente_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_componente" ADD CONSTRAINT "orden_servicio_componente_orden_servicio_id_orden_servicio_id_fk" FOREIGN KEY ("orden_servicio_id") REFERENCES "public"."orden_servicio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_componente" ADD CONSTRAINT "orden_servicio_componente_componente_id_componente_id_fk" FOREIGN KEY ("componente_id") REFERENCES "public"."componente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_cotizacion" ADD CONSTRAINT "orden_servicio_cotizacion_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_cotizacion" ADD CONSTRAINT "orden_servicio_cotizacion_orden_servicio_id_orden_servicio_id_fk" FOREIGN KEY ("orden_servicio_id") REFERENCES "public"."orden_servicio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_cotizacion" ADD CONSTRAINT "orden_servicio_cotizacion_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_evidencia" ADD CONSTRAINT "orden_servicio_evidencia_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_evidencia" ADD CONSTRAINT "orden_servicio_evidencia_orden_servicio_id_orden_servicio_id_fk" FOREIGN KEY ("orden_servicio_id") REFERENCES "public"."orden_servicio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orden_servicio_evidencia" ADD CONSTRAINT "orden_servicio_evidencia_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_os_tenant_estado" ON "orden_servicio" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_os_tenant_cliente" ON "orden_servicio" USING btree ("tenant_id","cliente_id");--> statement-breakpoint
CREATE INDEX "idx_os_tenant_tecnico" ON "orden_servicio" USING btree ("tenant_id","tecnico_id");--> statement-breakpoint
CREATE INDEX "idx_os_tenant_codigo" ON "orden_servicio" USING btree ("tenant_id","codigo");--> statement-breakpoint
CREATE INDEX "idx_osc_orden_servicio" ON "orden_servicio_componente" USING btree ("orden_servicio_id");--> statement-breakpoint
CREATE INDEX "idx_oscot_orden_servicio" ON "orden_servicio_cotizacion" USING btree ("orden_servicio_id");--> statement-breakpoint
CREATE INDEX "idx_osev_orden_servicio" ON "orden_servicio_evidencia" USING btree ("orden_servicio_id");--> statement-breakpoint
ALTER TABLE "orden_servicio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orden_servicio_componente" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orden_servicio_cotizacion" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orden_servicio_evidencia" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "orden_servicio_tenant_isolation" ON "orden_servicio"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "orden_servicio_componente_tenant_isolation" ON "orden_servicio_componente"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "orden_servicio_cotizacion_tenant_isolation" ON "orden_servicio_cotizacion"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "orden_servicio_evidencia_tenant_isolation" ON "orden_servicio_evidencia"
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);