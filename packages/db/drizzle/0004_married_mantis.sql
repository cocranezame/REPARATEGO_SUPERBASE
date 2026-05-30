CREATE TYPE "public"."tipo_movimiento" AS ENUM('INGRESO', 'VENTA', 'SERVICIO', 'MERMA', 'REAJUSTE', 'TRANSFERENCIA');--> statement-breakpoint
CREATE TYPE "public"."tipo_producto" AS ENUM('PRODUCTO', 'SERVICIO');--> statement-breakpoint
CREATE TABLE "lote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"sucursal_id" uuid NOT NULL,
	"orden_compra_id" uuid,
	"sku" varchar(50) NOT NULL,
	"cantidad_inicial" integer NOT NULL,
	"cantidad_actual" integer NOT NULL,
	"precio_unitario" numeric(12, 2) NOT NULL,
	"fecha_ingreso" date NOT NULL,
	"fecha_vencimiento" date,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metodo_pago_catalogo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimiento_inventario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"lote_id" uuid,
	"sucursal_id" uuid NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"cantidad" integer NOT NULL,
	"referencia_tipo" varchar(30),
	"referencia_id" uuid,
	"notas" text,
	"usuario_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "producto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"tipo" "tipo_producto" NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"descripcion" text,
	"categoria_id" uuid NOT NULL,
	"componente_id" uuid,
	"marca_id" uuid,
	"unidad_medida" varchar(10) DEFAULT 'UND' NOT NULL,
	"precio_compra" numeric(12, 2),
	"precio_venta" numeric(12, 2) NOT NULL,
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	"imagen_url" varchar(500),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "producto_compatibilidad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"producto_id" uuid NOT NULL,
	"modelo_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasa_precio" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"porcentaje" numeric(5, 2) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metodo_pago_catalogo" ADD CONSTRAINT "metodo_pago_catalogo_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_lote_id_lote_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lote"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimiento_inventario" ADD CONSTRAINT "movimiento_inventario_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_componente_id_componente_id_fk" FOREIGN KEY ("componente_id") REFERENCES "public"."componente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto" ADD CONSTRAINT "producto_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto_compatibilidad" ADD CONSTRAINT "producto_compatibilidad_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto_compatibilidad" ADD CONSTRAINT "producto_compatibilidad_producto_id_producto_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."producto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto_compatibilidad" ADD CONSTRAINT "producto_compatibilidad_modelo_id_modelo_id_fk" FOREIGN KEY ("modelo_id") REFERENCES "public"."modelo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasa_precio" ADD CONSTRAINT "tasa_precio_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_producto_tenant_codigo" ON "producto" USING btree ("tenant_id","codigo");--> statement-breakpoint
CREATE INDEX "idx_producto_tenant_categoria" ON "producto" USING btree ("tenant_id","categoria_id");--> statement-breakpoint
CREATE INDEX "idx_producto_tenant_nombre" ON "producto" USING btree ("tenant_id","nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_prod_compat_tenant_prod_modelo" ON "producto_compatibilidad" USING btree ("tenant_id","producto_id","modelo_id");