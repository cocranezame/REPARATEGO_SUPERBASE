CREATE TYPE "public"."plan_tenant" AS ENUM('BASIC', 'PRO', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('ADMIN', 'TECNICO', 'VENDEDOR', 'CAJERO');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento" AS ENUM('DNI', 'RUC', 'CE');--> statement-breakpoint
CREATE TABLE "categoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"categoria_padre_id" uuid,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "componente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"logo_url" varchar(500),
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modelo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"marca_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cliente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"tipo_documento" "tipo_documento" NOT NULL,
	"numero_documento" varchar(20) NOT NULL,
	"tipo_persona" varchar(10) DEFAULT 'NATURAL' NOT NULL,
	"nombres" varchar(100),
	"apellidos" varchar(100),
	"razon_social" varchar(200),
	"email" varchar(150),
	"telefono" varchar(20),
	"telefono_secundario" varchar(20),
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cliente_direccion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"cliente_id" uuid NOT NULL,
	"etiqueta" varchar(50) DEFAULT 'PRINCIPAL' NOT NULL,
	"direccion" varchar(255) NOT NULL,
	"distrito" varchar(100),
	"provincia" varchar(100),
	"departamento" varchar(100),
	"referencia" varchar(255),
	"latitud" numeric(10, 7),
	"longitud" numeric(10, 7),
	"es_principal" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"clave" varchar(50) NOT NULL,
	"habilitado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sucursal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"direccion" varchar(255),
	"distrito" varchar(100),
	"telefono" varchar(20),
	"es_principal" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"ruc" varchar(11),
	"plan" "plan_tenant" DEFAULT 'BASIC' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"sucursal_id" uuid,
	"tipo_documento" "tipo_documento" NOT NULL,
	"numero_documento" varchar(20) NOT NULL,
	"nombres" varchar(100) NOT NULL,
	"apellidos" varchar(100) NOT NULL,
	"email" varchar(150),
	"telefono" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"rol" "rol_usuario" NOT NULL,
	"ultimo_login" timestamp with time zone,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "componente" ADD CONSTRAINT "componente_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "componente" ADD CONSTRAINT "componente_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marca" ADD CONSTRAINT "marca_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo" ADD CONSTRAINT "modelo_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo" ADD CONSTRAINT "modelo_marca_id_marca_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modelo" ADD CONSTRAINT "modelo_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente_direccion" ADD CONSTRAINT "cliente_direccion_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cliente_direccion" ADD CONSTRAINT "cliente_direccion_cliente_id_cliente_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."cliente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag" ADD CONSTRAINT "feature_flag_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sucursal" ADD CONSTRAINT "sucursal_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_tenant_id_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_sucursal_id_sucursal_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_categoria_tenant_nombre" ON "categoria" USING btree ("tenant_id","nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_componente_tenant_categoria_nombre" ON "componente" USING btree ("tenant_id","categoria_id","nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_marca_tenant_nombre" ON "marca" USING btree ("tenant_id","nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_modelo_tenant_marca_nombre" ON "modelo" USING btree ("tenant_id","marca_id","nombre");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_cliente_tenant_documento" ON "cliente" USING btree ("tenant_id","numero_documento");--> statement-breakpoint
CREATE INDEX "idx_cliente_tenant_telefono" ON "cliente" USING btree ("tenant_id","telefono");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_feature_flag_tenant_clave" ON "feature_flag" USING btree ("tenant_id","clave");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_usuario_tenant_documento" ON "usuario" USING btree ("tenant_id","numero_documento");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_usuario_tenant_email" ON "usuario" USING btree ("tenant_id","email") WHERE "usuario"."email" is not null;