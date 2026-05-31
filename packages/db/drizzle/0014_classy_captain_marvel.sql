CREATE TYPE "public"."estado_cotizacion_venta" AS ENUM('BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA');--> statement-breakpoint
CREATE TYPE "public"."estado_venta" AS ENUM('PENDIENTE', 'PAGADA', 'PARCIAL', 'ANULADA');--> statement-breakpoint
CREATE TYPE "public"."tipo_comprobante" AS ENUM('BOLETA', 'FACTURA', 'NOTA_VENTA');--> statement-breakpoint
CREATE TYPE "public"."tipo_venta" AS ENUM('LIBRE', 'SERVICIO', 'REVISION_DOMICILIO', 'REVISION_DEVOLUCION');--> statement-breakpoint
CREATE TABLE "caja" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sucursal_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"monto_apertura" numeric(12, 2) NOT NULL,
	"monto_cierre" numeric(12, 2),
	"fecha_apertura" timestamp with time zone DEFAULT now() NOT NULL,
	"fecha_cierre" timestamp with time zone,
	"estado" varchar(10) DEFAULT 'ABIERTA' NOT NULL,
	"notas_cierre" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotizacion_venta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"cliente_id" uuid,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"igv" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estado" "estado_cotizacion_venta" DEFAULT 'BORRADOR' NOT NULL,
	"fecha_vencimiento" date,
	"usuario_id" uuid NOT NULL,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cotizacion_venta_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cotizacion_venta_id" uuid NOT NULL,
	"producto_id" uuid,
	"descripcion" varchar(200) NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"caja_id" uuid NOT NULL,
	"sucursal_id" uuid NOT NULL,
	"cliente_id" uuid,
	"tipo_venta" "tipo_venta" DEFAULT 'LIBRE' NOT NULL,
	"orden_servicio_id" uuid,
	"visita_domicilio_id" uuid,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"descuento" numeric(12, 2) DEFAULT '0' NOT NULL,
	"igv" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"estado" "estado_venta" DEFAULT 'PENDIENTE' NOT NULL,
	"tipo_comprobante" "tipo_comprobante",
	"serie_comprobante" varchar(10),
	"numero_comprobante" varchar(15),
	"usuario_id" uuid NOT NULL,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venta_envio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"venta_id" uuid NOT NULL,
	"direccion_id" uuid,
	"direccion_texto" varchar(255) NOT NULL,
	"estado" varchar(15) DEFAULT 'PENDIENTE' NOT NULL,
	"fecha_envio" timestamp with time zone,
	"fecha_entrega" timestamp with time zone,
	"costo_envio" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notas" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venta_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"venta_id" uuid NOT NULL,
	"producto_id" uuid,
	"descripcion" varchar(200) NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"descuento" numeric(12, 2) DEFAULT '0' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venta_pago" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"venta_id" uuid NOT NULL,
	"metodo_pago_id" uuid NOT NULL,
	"monto" numeric(12, 2) NOT NULL,
	"referencia" varchar(100),
	"fecha_pago" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "caja" ADD CONSTRAINT "caja_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caja" ADD CONSTRAINT "caja_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "caja" ADD CONSTRAINT "caja_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_venta" ADD CONSTRAINT "cotizacion_venta_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_venta" ADD CONSTRAINT "cotizacion_venta_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_venta_item" ADD CONSTRAINT "cotizacion_venta_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_venta_item" ADD CONSTRAINT "cotizacion_venta_item_cotizacion_venta_id_cotizacion_venta_id_fk" FOREIGN KEY ("cotizacion_venta_id") REFERENCES "public"."cotizacion_venta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cotizacion_venta_item" ADD CONSTRAINT "cotizacion_venta_item_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta" ADD CONSTRAINT "venta_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta" ADD CONSTRAINT "venta_caja_id_caja_id_fk" FOREIGN KEY ("caja_id") REFERENCES "public"."caja"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta" ADD CONSTRAINT "venta_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta" ADD CONSTRAINT "venta_orden_servicio_id_orden_servicio_id_fk" FOREIGN KEY ("orden_servicio_id") REFERENCES "public"."orden_servicio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta" ADD CONSTRAINT "venta_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_envio" ADD CONSTRAINT "venta_envio_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_envio" ADD CONSTRAINT "venta_envio_venta_id_venta_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."venta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_envio" ADD CONSTRAINT "venta_envio_direccion_id_cliente_direccion_id_fk" FOREIGN KEY ("direccion_id") REFERENCES "public"."cliente_direccion"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_item" ADD CONSTRAINT "venta_item_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_item" ADD CONSTRAINT "venta_item_venta_id_venta_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."venta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_item" ADD CONSTRAINT "venta_item_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_pago" ADD CONSTRAINT "venta_pago_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_pago" ADD CONSTRAINT "venta_pago_venta_id_venta_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."venta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venta_pago" ADD CONSTRAINT "venta_pago_metodo_pago_id_metodo_pago_catalogo_id_fk" FOREIGN KEY ("metodo_pago_id") REFERENCES "public"."metodo_pago_catalogo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_caja_tenant_estado" ON "caja" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_caja_tenant_sucursal" ON "caja" USING btree ("tenant_id","sucursal_id");--> statement-breakpoint
CREATE INDEX "idx_caja_usuario" ON "caja" USING btree ("tenant_id","usuario_id");--> statement-breakpoint
CREATE INDEX "idx_cotizacion_venta_tenant_estado" ON "cotizacion_venta" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_cotizacion_venta_tenant_cliente" ON "cotizacion_venta" USING btree ("tenant_id","cliente_id");--> statement-breakpoint
CREATE INDEX "idx_cotizacion_venta_item_cotizacion" ON "cotizacion_venta_item" USING btree ("cotizacion_venta_id");--> statement-breakpoint
CREATE INDEX "idx_venta_tenant_estado" ON "venta" USING btree ("tenant_id","estado");--> statement-breakpoint
CREATE INDEX "idx_venta_tenant_caja" ON "venta" USING btree ("tenant_id","caja_id");--> statement-breakpoint
CREATE INDEX "idx_venta_tenant_cliente" ON "venta" USING btree ("tenant_id","cliente_id");--> statement-breakpoint
CREATE INDEX "idx_venta_tenant_codigo" ON "venta" USING btree ("tenant_id","codigo");--> statement-breakpoint
CREATE INDEX "idx_venta_envio_venta" ON "venta_envio" USING btree ("venta_id");--> statement-breakpoint
CREATE INDEX "idx_venta_item_venta" ON "venta_item" USING btree ("venta_id");--> statement-breakpoint
CREATE INDEX "idx_venta_pago_venta" ON "venta_pago" USING btree ("venta_id");