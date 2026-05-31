import { config } from "dotenv";

// Cargar .env desde la raíz del monorepo (CWD = packages/db cuando corre con pnpm filter)
config({ path: "../../.env" });

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  categoria,
  cliente,
  clienteDireccion,
  componente,
  costoRevision,
  featureFlag,
  instancia,
  instanciaImagen,
  marca,
  metodoPagoCatalogo,
  modelo,
  ordenServicio,
  producto,
  proveedor,
  sucursal,
  tarifaDistrito,
  tenant,
  usuario,
} from "./schema/index.js";

// ── IDs fijos para idempotencia (re-runs seguros) ──────────────────────────────
const TENANT_ID = "a0000000-0000-0000-0000-000000000001";
const SUCURSAL_ID = "c0000000-0000-0000-0000-000000000001";
const USR_ADMIN = "a0000000-0000-0000-0000-000000000010";
const USR_TECNICO = "a0000000-0000-0000-0000-000000000011";
const USR_VENDEDOR = "a0000000-0000-0000-0000-000000000012";
const CAT_CEL = "a0000000-0000-0000-0000-000000000020";
const CAT_LAP = "a0000000-0000-0000-0000-000000000021";
const CAT_TAB = "a0000000-0000-0000-0000-000000000022";
const COMP_PANT = "a0000000-0000-0000-0000-000000000030";
const COMP_BAT = "a0000000-0000-0000-0000-000000000031";
const COMP_PLACA = "a0000000-0000-0000-0000-000000000032";
const MARCA_SAM = "a0000000-0000-0000-0000-000000000040";
const MARCA_APP = "a0000000-0000-0000-0000-000000000041";
const MARCA_XIA = "a0000000-0000-0000-0000-000000000042";
const MARCA_LEN = "a0000000-0000-0000-0000-000000000043";
const MOD_S24 = "a0000000-0000-0000-0000-000000000050";
const MOD_IP15 = "a0000000-0000-0000-0000-000000000051";
const MOD_RN13 = "a0000000-0000-0000-0000-000000000052";
const PROD_001 = "a0000000-0000-0000-0000-000000000060";
const PROD_002 = "a0000000-0000-0000-0000-000000000061";
const PROD_SRV = "a0000000-0000-0000-0000-000000000062";
const METODO_EFECTIVO = "a0000000-0000-0000-0000-000000000090";
const METODO_YAPE = "a0000000-0000-0000-0000-000000000091";
const METODO_PLIN = "a0000000-0000-0000-0000-000000000092";
const METODO_TRANSF = "a0000000-0000-0000-0000-000000000093";
const METODO_TARJETA = "a0000000-0000-0000-0000-000000000094";
const PROV_ID = "a0000000-0000-0000-0000-000000000070";
const CLI_ID = "a0000000-0000-0000-0000-000000000080";
const CLI_DIR_ID = "a0000000-0000-0000-0000-000000000081";
// Productos dispositivo (no repuestos) — usados como base de instancia
const PROD_DEV_SAM = "a0000000-0000-0000-0000-000000000063";
const PROD_DEV_APP = "a0000000-0000-0000-0000-000000000064";
const PROD_DEV_XIA = "a0000000-0000-0000-0000-000000000065";
const PROD_DEV_LEN = "a0000000-0000-0000-0000-000000000066";
// Instancias (equipo físico del cliente)
const INST_001 = "a0000000-0000-0000-0000-000000000111";
const INST_002 = "a0000000-0000-0000-0000-000000000112";
const INST_003 = "a0000000-0000-0000-0000-000000000113";
const INST_004 = "a0000000-0000-0000-0000-000000000114";
const INST_005 = "a0000000-0000-0000-0000-000000000115";
// Órdenes de servicio
const OS_001 = "a0000000-0000-0000-0000-000000000101";
const OS_002 = "a0000000-0000-0000-0000-000000000102";
const OS_003 = "a0000000-0000-0000-0000-000000000103";
const OS_004 = "a0000000-0000-0000-0000-000000000104";
const OS_005 = "a0000000-0000-0000-0000-000000000105";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definido — verifica .env");

  const sql = postgres(url, { max: 5 });
  const db = drizzle(sql);

  console.log("Iniciando seed...");

  // ── Tenant ────────────────────────────────────────────────────────────────────
  await db
    .insert(tenant)
    .values({
      id: TENANT_ID,
      nombre: "ReparaTego Demo",
      ruc: "20123456789",
      plan: "PRO",
      activo: true,
    })
    .onConflictDoNothing();
  console.log("  [ok] tenant");

  // ── Sucursal ──────────────────────────────────────────────────────────────────
  await db
    .insert(sucursal)
    .values({
      id: SUCURSAL_ID,
      tenant_id: TENANT_ID,
      nombre: "Sede Central Lima Norte",
      distrito: "Los Olivos",
      es_principal: true,
      activo: true,
    })
    .onConflictDoNothing();
  console.log("  [ok] sucursal");

  // ── Usuarios ──────────────────────────────────────────────────────────────────
  const [adminHash, tecnicoHash, vendedorHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("tecnico123", 10),
    bcrypt.hash("vendedor123", 10),
  ]);

  await db
    .insert(usuario)
    .values([
      {
        id: USR_ADMIN,
        tenant_id: TENANT_ID,
        sucursal_id: SUCURSAL_ID,
        tipo_documento: "DNI",
        numero_documento: "12345678",
        nombres: "Admin",
        apellidos: "Sistema",
        rol: "ADMIN",
        password_hash: adminHash,
        activo: true,
      },
      {
        id: USR_TECNICO,
        tenant_id: TENANT_ID,
        tipo_documento: "DNI",
        numero_documento: "87654321",
        nombres: "Carlos",
        apellidos: "Técnico",
        rol: "TECNICO",
        password_hash: tecnicoHash,
        activo: true,
      },
      {
        id: USR_VENDEDOR,
        tenant_id: TENANT_ID,
        tipo_documento: "DNI",
        numero_documento: "11223344",
        nombres: "María",
        apellidos: "Vendedora",
        rol: "VENDEDOR",
        password_hash: vendedorHash,
        activo: true,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] usuarios");

  // ── Feature flags ─────────────────────────────────────────────────────────────
  await db
    .insert(featureFlag)
    .values([
      { tenant_id: TENANT_ID, clave: "MODULO_CRM", habilitado: false },
      { tenant_id: TENANT_ID, clave: "MODULO_DOMICILIOS", habilitado: true },
    ])
    .onConflictDoNothing();
  console.log("  [ok] feature flags");

  // ── Categorías ────────────────────────────────────────────────────────────────
  await db
    .insert(categoria)
    .values([
      { id: CAT_CEL, tenant_id: TENANT_ID, nombre: "Celulares", orden: 1 },
      { id: CAT_LAP, tenant_id: TENANT_ID, nombre: "Laptops", orden: 2 },
      { id: CAT_TAB, tenant_id: TENANT_ID, nombre: "Tablets", orden: 3 },
    ])
    .onConflictDoNothing();
  console.log("  [ok] categorias");

  // ── Componentes ───────────────────────────────────────────────────────────────
  await db
    .insert(componente)
    .values([
      { id: COMP_PANT, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Pantalla" },
      { id: COMP_BAT, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Batería" },
      { id: COMP_PLACA, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Placa madre" },
    ])
    .onConflictDoNothing();
  console.log("  [ok] componentes");

  // ── Marcas ────────────────────────────────────────────────────────────────────
  await db
    .insert(marca)
    .values([
      { id: MARCA_SAM, tenant_id: TENANT_ID, nombre: "Samsung" },
      { id: MARCA_APP, tenant_id: TENANT_ID, nombre: "Apple" },
      { id: MARCA_XIA, tenant_id: TENANT_ID, nombre: "Xiaomi" },
      { id: MARCA_LEN, tenant_id: TENANT_ID, nombre: "Lenovo" },
    ])
    .onConflictDoNothing();
  console.log("  [ok] marcas");

  // ── Modelos ───────────────────────────────────────────────────────────────────
  await db
    .insert(modelo)
    .values([
      {
        id: MOD_S24,
        tenant_id: TENANT_ID,
        marca_id: MARCA_SAM,
        categoria_id: CAT_CEL,
        nombre: "Galaxy S24",
      },
      {
        id: MOD_IP15,
        tenant_id: TENANT_ID,
        marca_id: MARCA_APP,
        categoria_id: CAT_CEL,
        nombre: "iPhone 15",
      },
      {
        id: MOD_RN13,
        tenant_id: TENANT_ID,
        marca_id: MARCA_XIA,
        categoria_id: CAT_CEL,
        nombre: "Redmi Note 13",
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] modelos");

  // ── Productos ─────────────────────────────────────────────────────────────────
  await db
    .insert(producto)
    .values([
      {
        id: PROD_001,
        tenant_id: TENANT_ID,
        codigo: "PRD-0001",
        tipo: "PRODUCTO",
        nombre: "Pantalla Galaxy S24",
        categoria_id: CAT_CEL,
        componente_id: COMP_PANT,
        marca_id: MARCA_SAM,
        precio_venta: "350.00",
        precio_compra: "220.00",
        stock_minimo: 2,
      },
      {
        id: PROD_002,
        tenant_id: TENANT_ID,
        codigo: "PRD-0002",
        tipo: "PRODUCTO",
        nombre: "Batería iPhone 15",
        categoria_id: CAT_CEL,
        componente_id: COMP_BAT,
        marca_id: MARCA_APP,
        precio_venta: "120.00",
        precio_compra: "75.00",
        stock_minimo: 3,
      },
      {
        id: PROD_SRV,
        tenant_id: TENANT_ID,
        codigo: "SRV-0001",
        tipo: "SERVICIO",
        nombre: "Diagnóstico general",
        categoria_id: CAT_CEL,
        precio_venta: "30.00",
        stock_minimo: 0,
      },
      // Dispositivos (no son repuestos — son la base de instancias)
      {
        id: PROD_DEV_SAM,
        tenant_id: TENANT_ID,
        codigo: "PRD-0063",
        tipo: "PRODUCTO",
        nombre: "Samsung Galaxy S24",
        categoria_id: CAT_CEL,
        marca_id: MARCA_SAM,
        precio_venta: "0.00",
        stock_minimo: 0,
      },
      {
        id: PROD_DEV_APP,
        tenant_id: TENANT_ID,
        codigo: "PRD-0064",
        tipo: "PRODUCTO",
        nombre: "Apple iPhone 15",
        categoria_id: CAT_CEL,
        marca_id: MARCA_APP,
        precio_venta: "0.00",
        stock_minimo: 0,
      },
      {
        id: PROD_DEV_XIA,
        tenant_id: TENANT_ID,
        codigo: "PRD-0065",
        tipo: "PRODUCTO",
        nombre: "Xiaomi Redmi Note 13",
        categoria_id: CAT_CEL,
        marca_id: MARCA_XIA,
        precio_venta: "0.00",
        stock_minimo: 0,
      },
      {
        id: PROD_DEV_LEN,
        tenant_id: TENANT_ID,
        codigo: "PRD-0066",
        tipo: "PRODUCTO",
        nombre: "Lenovo IdeaPad",
        categoria_id: CAT_LAP,
        marca_id: MARCA_LEN,
        precio_venta: "0.00",
        stock_minimo: 0,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] productos");

  // ── Métodos de pago ───────────────────────────────────────────────────────────
  // IDs fijos porque metodo_pago_catalogo no tiene unique en (tenant_id, nombre)
  await db
    .insert(metodoPagoCatalogo)
    .values([
      { id: METODO_EFECTIVO, tenant_id: TENANT_ID, nombre: "EFECTIVO" },
      { id: METODO_YAPE, tenant_id: TENANT_ID, nombre: "YAPE" },
      { id: METODO_PLIN, tenant_id: TENANT_ID, nombre: "PLIN" },
      { id: METODO_TRANSF, tenant_id: TENANT_ID, nombre: "TRANSFERENCIA" },
      { id: METODO_TARJETA, tenant_id: TENANT_ID, nombre: "TARJETA" },
    ])
    .onConflictDoNothing();
  console.log("  [ok] metodos de pago");

  // ── Proveedor ─────────────────────────────────────────────────────────────────
  await db
    .insert(proveedor)
    .values({
      id: PROV_ID,
      tenant_id: TENANT_ID,
      ruc: "20456789012",
      razon_social: "TechParts SAC",
      nombre_comercial: "TechParts",
      distrito: "Lima",
      telefono: "014567890",
      calificacion: 4,
      activo: true,
    })
    .onConflictDoNothing();
  console.log("  [ok] proveedor");

  // ── Cliente + dirección ───────────────────────────────────────────────────────
  await db
    .insert(cliente)
    .values({
      id: CLI_ID,
      tenant_id: TENANT_ID,
      tipo_documento: "DNI",
      numero_documento: "45678901",
      tipo_persona: "NATURAL",
      nombres: "Juan",
      apellidos: "Pérez",
      telefono: "999888777",
      activo: true,
    })
    .onConflictDoNothing();

  await db
    .insert(clienteDireccion)
    .values({
      id: CLI_DIR_ID,
      tenant_id: TENANT_ID,
      cliente_id: CLI_ID,
      etiqueta: "PRINCIPAL",
      direccion: "Av. Universitaria 1234",
      distrito: "Los Olivos",
      provincia: "Lima",
      departamento: "Lima",
      es_principal: true,
      activo: true,
    })
    .onConflictDoNothing();
  console.log("  [ok] cliente");

  // ── Tarifas de distrito ───────────────────────────────────────────────────────
  await db
    .insert(tarifaDistrito)
    .values([
      { tenant_id: TENANT_ID, distrito: "Los Olivos", provincia: "Lima", tarifa: "20.00" },
      {
        tenant_id: TENANT_ID,
        distrito: "San Martín de Porres",
        provincia: "Lima",
        tarifa: "25.00",
      },
      { tenant_id: TENANT_ID, distrito: "Comas", provincia: "Lima", tarifa: "30.00" },
    ])
    .onConflictDoNothing();
  console.log("  [ok] tarifas de distrito");

  // ── Costos de revisión por categoría ─────────────────────────────────────────
  await db
    .insert(costoRevision)
    .values([
      { tenant_id: TENANT_ID, categoria_id: CAT_CEL, monto: "20.00", created_by: USR_ADMIN },
      { tenant_id: TENANT_ID, categoria_id: CAT_LAP, monto: "30.00", created_by: USR_ADMIN },
      { tenant_id: TENANT_ID, categoria_id: CAT_TAB, monto: "25.00", created_by: USR_ADMIN },
    ])
    .onConflictDoNothing();
  console.log("  [ok] costos de revision");

  // ── Instancias (equipos físicos del cliente) ──────────────────────────────────
  await db
    .insert(instancia)
    .values([
      {
        id: INST_001,
        tenant_id: TENANT_ID,
        cliente_id: CLI_ID,
        producto_id: PROD_DEV_SAM,
        numero_serie: "R3QA123456",
        created_by: USR_ADMIN,
      },
      {
        id: INST_002,
        tenant_id: TENANT_ID,
        cliente_id: CLI_ID,
        producto_id: PROD_DEV_APP,
        created_by: USR_ADMIN,
      },
      {
        id: INST_003,
        tenant_id: TENANT_ID,
        cliente_id: CLI_ID,
        producto_id: PROD_DEV_XIA,
        created_by: USR_VENDEDOR,
      },
      {
        id: INST_004,
        tenant_id: TENANT_ID,
        cliente_id: CLI_ID,
        producto_id: PROD_DEV_LEN,
        created_by: USR_ADMIN,
      },
      {
        id: INST_005,
        tenant_id: TENANT_ID,
        cliente_id: CLI_ID,
        producto_id: PROD_DEV_SAM,
        numero_serie: "R3QB789012",
        created_by: USR_VENDEDOR,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] instancias");

  // ── Imágenes de instancia (mín. 1 por instancia — regla R1) ──────────────────
  await db
    .insert(instanciaImagen)
    .values([
      {
        tenant_id: TENANT_ID,
        instancia_id: INST_001,
        url: "https://placehold.co/400x400.png",
        descripcion: "Vista frontal",
        orden: 1,
      },
      {
        tenant_id: TENANT_ID,
        instancia_id: INST_002,
        url: "https://placehold.co/400x400.png",
        descripcion: "Vista frontal",
        orden: 1,
      },
      {
        tenant_id: TENANT_ID,
        instancia_id: INST_003,
        url: "https://placehold.co/400x400.png",
        descripcion: "Vista frontal",
        orden: 1,
      },
      {
        tenant_id: TENANT_ID,
        instancia_id: INST_004,
        url: "https://placehold.co/400x400.png",
        descripcion: "Vista frontal",
        orden: 1,
      },
      {
        tenant_id: TENANT_ID,
        instancia_id: INST_005,
        url: "https://placehold.co/400x400.png",
        descripcion: "Vista frontal",
        orden: 1,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] imagenes de instancia");

  // ── Órdenes de servicio de prueba (C002) ──────────────────────────────────────
  await db
    .insert(ordenServicio)
    .values([
      {
        id: OS_001,
        tenant_id: TENANT_ID,
        codigo: "OS-00001",
        instancia_id: INST_001,
        sucursal_id: SUCURSAL_ID,
        canal: "TIENDA",
        tipo_servicio: "REPARACION",
        falla_ingreso: "Pantalla rota — no enciende",
        costo_revision: "20.00",
        estado: "VALIDACION",
        tecnico_id: USR_TECNICO,
        vendedor_id: USR_ADMIN,
        created_by: USR_ADMIN,
      },
      {
        id: OS_002,
        tenant_id: TENANT_ID,
        codigo: "OS-00002",
        instancia_id: INST_002,
        sucursal_id: SUCURSAL_ID,
        canal: "TIENDA",
        tipo_servicio: "REPARACION",
        falla_ingreso: "Batería se agota muy rápido",
        costo_revision: "20.00",
        estado: "REVISION",
        tecnico_id: USR_TECNICO,
        vendedor_id: USR_ADMIN,
        created_by: USR_ADMIN,
      },
      {
        id: OS_003,
        tenant_id: TENANT_ID,
        codigo: "OS-00003",
        instancia_id: INST_003,
        sucursal_id: SUCURSAL_ID,
        canal: "DOMICILIO",
        tipo_servicio: "REPARACION",
        falla_ingreso: "No carga, conector dañado",
        diagnostico_tecnico: "Conector USB-C roto, requiere cambio",
        costo_revision: "20.00",
        estado: "DIAG_PRELIMINAR",
        tecnico_id: USR_TECNICO,
        vendedor_id: USR_VENDEDOR,
        created_by: USR_VENDEDOR,
      },
      {
        id: OS_004,
        tenant_id: TENANT_ID,
        codigo: "OS-00004",
        instancia_id: INST_004,
        sucursal_id: SUCURSAL_ID,
        canal: "TIENDA",
        tipo_servicio: "REPARACION",
        falla_ingreso: "Laptop lenta, posible virus",
        diagnostico_tecnico: "Múltiples malwares detectados",
        solucion: "Formateo y reinstalación del sistema",
        costo_revision: "30.00",
        estado: "REPARADO",
        tecnico_id: USR_TECNICO,
        vendedor_id: USR_ADMIN,
        created_by: USR_ADMIN,
      },
      {
        id: OS_005,
        tenant_id: TENANT_ID,
        codigo: "OS-00005",
        instancia_id: INST_005,
        sucursal_id: SUCURSAL_ID,
        canal: "TIENDA",
        tipo_servicio: "REPARACION",
        falla_ingreso: "Pantalla con rayas verticales",
        diagnostico_tecnico: "Display dañado internamente",
        solucion: "Cambio de pantalla original",
        costo_revision: "20.00",
        estado: "AVISADO",
        tecnico_id: USR_TECNICO,
        vendedor_id: USR_VENDEDOR,
        created_by: USR_VENDEDOR,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] ordenes de servicio de prueba");

  await sql.end();

  console.log("\nSeed completado. Base de datos lista para desarrollo.");
  console.log("\nCredenciales de prueba:");
  console.log("  Admin    — DNI: 12345678 / password: admin123");
  console.log("  Técnico  — DNI: 87654321 / password: tecnico123");
  console.log("  Vendedor — DNI: 11223344 / password: vendedor123");
  console.log(`\n  tenant_id: ${TENANT_ID}`);
  console.log(`  sucursal_id: ${SUCURSAL_ID}`);
}

main().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
