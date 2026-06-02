import { config } from "dotenv";

// Cargar .env desde la raíz del monorepo (CWD = packages/db cuando corre con pnpm filter)
config({ path: "../../.env" });

import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  caja,
  categoria,
  cliente,
  clienteDireccion,
  componente,
  costoRevision,
  crmAgente,
  crmBot,
  crmEtapa,
  crmEtiqueta,
  featureFlag,
  instancia,
  instanciaImagen,
  lote,
  marca,
  metodoPagoCatalogo,
  modelo,
  movimientoInventario,
  ordenServicio,
  proveedor,
  sucursal,
  tarifaDistrito,
  tenant,
  usuario,
  venta,
  ventaItem,
  ventaPago,
  visitaDomicilio,
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
// Celulares extra
const COMP_CONECTOR = "a0000000-0000-0000-0000-000000000033";
const COMP_CAM_TRAS = "a0000000-0000-0000-0000-000000000034";
const COMP_CAM_FRONT = "a0000000-0000-0000-0000-000000000035";
const COMP_MIC = "a0000000-0000-0000-0000-000000000036";
const COMP_PARLANTE = "a0000000-0000-0000-0000-000000000037";
const COMP_PLACA_CEL = "a0000000-0000-0000-0000-000000000038";
// Laptops extra
const COMP_PANT_LAP = "a0000000-0000-0000-0000-000000000039";
const COMP_TECLADO = "a0000000-0000-0000-0000-000000000040";
const COMP_BAT_LAP = "a0000000-0000-0000-0000-000000000041";
const COMP_SSD = "a0000000-0000-0000-0000-000000000042";
const COMP_RAM = "a0000000-0000-0000-0000-000000000043";
const COMP_VENT = "a0000000-0000-0000-0000-000000000044";
// Tablets
const COMP_PANT_TAB = "a0000000-0000-0000-0000-000000000045";
const COMP_BAT_TAB = "a0000000-0000-0000-0000-000000000046";
const COMP_CONECTOR_TAB = "a0000000-0000-0000-0000-000000000047";
const COMP_CAM_TAB = "a0000000-0000-0000-0000-000000000048";
const COMP_PLACA_TAB = "a0000000-0000-0000-0000-000000000049";
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
// Usuarios extra
const USR_CAJERO = "a0000000-0000-0000-0000-000000000013";
const USR_ALMACEN = "a0000000-0000-0000-0000-000000000014";
// Caja
const CAJA_ID = "b0000000-0000-0000-0000-000000000001";
// Lotes de inventario
const LOTE_001 = "d0000000-0000-0000-0000-000000000001";
const LOTE_002 = "d0000000-0000-0000-0000-000000000002";
const LOTE_003 = "d0000000-0000-0000-0000-000000000003";
// Ventas
const VENTA_001 = "e0000000-0000-0000-0000-000000000001";
const VENTA_002 = "e0000000-0000-0000-0000-000000000002";
const VENTA_003 = "e0000000-0000-0000-0000-000000000003";
// Cotizaciones y OC de compra
const COT_C_001 = "f0000000-0000-0000-0000-000000000001";
const COT_C_002 = "f0000000-0000-0000-0000-000000000002";
const OC_001 = "f0000000-0000-0000-0000-000000000010";
// Clientes extra
const CLI_002 = "a0000000-0000-0000-0000-000000000082";
const CLI_003 = "a0000000-0000-0000-0000-000000000083";
// Proveedores extra
const PROV_002 = "a0000000-0000-0000-0000-000000000071";
// Visitas domicilio
const VD_001 = "a0000000-0000-0000-0000-000000000200";
const VD_002 = "a0000000-0000-0000-0000-000000000201";
const VD_003 = "a0000000-0000-0000-0000-000000000202";
// CRM — Bots
const BOT_COT_REP = "c2000000-0000-0000-0000-000000000001";
const BOT_SRV_PROC = "c2000000-0000-0000-0000-000000000002";
const BOT_RECORDATORIO = "c2000000-0000-0000-0000-000000000003";
// CRM — Etapas
const ETAPA_01 = "c1000000-0000-0000-0000-000000000001"; // PRIMER_CONTACTO
const ETAPA_02 = "c1000000-0000-0000-0000-000000000002"; // IDENTIFICACION
const ETAPA_03 = "c1000000-0000-0000-0000-000000000003"; // CAPTURA_EQUIPO
const ETAPA_04 = "c1000000-0000-0000-0000-000000000004"; // CAPTURA_FALLA
const ETAPA_05 = "c1000000-0000-0000-0000-000000000005"; // CAPTURA_UBICACION
const ETAPA_06 = "c1000000-0000-0000-0000-000000000006"; // COTIZACION_INFORMAL
const ETAPA_07 = "c1000000-0000-0000-0000-000000000007"; // DECISION_CLIENTE
const ETAPA_08 = "c1000000-0000-0000-0000-000000000008"; // REGISTRO_CLIENTE
const ETAPA_09 = "c1000000-0000-0000-0000-000000000009"; // REGISTRO_SERVICIO
const ETAPA_10 = "c1000000-0000-0000-0000-000000000010"; // DERIVACION_VENDEDOR
const ETAPA_11 = "c1000000-0000-0000-0000-000000000011"; // SEGUIMIENTO_SERVICIO
const ETAPA_12 = "c1000000-0000-0000-0000-000000000012"; // COTIZACION_REPUESTO
const ETAPA_13 = "c1000000-0000-0000-0000-000000000013"; // ESPERANDO_RESPUESTA
const ETAPA_14 = "c1000000-0000-0000-0000-000000000014"; // CONVERTIDO
const ETAPA_15 = "c1000000-0000-0000-0000-000000000015"; // SIN_RESPUESTA
// CRM — Etiquetas
const ETQ_01 = "c3000000-0000-0000-0000-000000000001"; // NOMBRE_CAPTURADO
const ETQ_02 = "c3000000-0000-0000-0000-000000000002"; // DOCUMENTO_CAPTURADO
const ETQ_03 = "c3000000-0000-0000-0000-000000000003"; // CELULAR_CAPTURADO
const ETQ_04 = "c3000000-0000-0000-0000-000000000004"; // UBICACION_CAPTURADA
const ETQ_05 = "c3000000-0000-0000-0000-000000000005"; // RUTA_REPARACION
const ETQ_06 = "c3000000-0000-0000-0000-000000000006"; // RUTA_COTIZACION
const ETQ_07 = "c3000000-0000-0000-0000-000000000007"; // RUTA_CONSULTA_ESTADO
const ETQ_08 = "c3000000-0000-0000-0000-000000000008"; // RUTA_INFORMACION
const ETQ_09 = "c3000000-0000-0000-0000-000000000009"; // EQUIPO_IDENTIFICADO
const ETQ_10 = "c3000000-0000-0000-0000-000000000010"; // FALLA_DESCRITA
const ETQ_11 = "c3000000-0000-0000-0000-000000000011"; // MARCA_IDENTIFICADA
const ETQ_12 = "c3000000-0000-0000-0000-000000000012"; // MODELO_IDENTIFICADO
const ETQ_13 = "c3000000-0000-0000-0000-000000000013"; // COTIZACION_ENVIADA
const ETQ_14 = "c3000000-0000-0000-0000-000000000014"; // PRESUPUESTO_ACEPTADO
const ETQ_15 = "c3000000-0000-0000-0000-000000000015"; // CLIENTE_EXISTENTE
const ETQ_16 = "c3000000-0000-0000-0000-000000000016"; // CLIENTE_NUEVO
const ETQ_17 = "c3000000-0000-0000-0000-000000000017"; // SERVICIO_CREADO
const ETQ_18 = "c3000000-0000-0000-0000-000000000018"; // DERIVADO_VENDEDOR
const ETQ_19 = "c3000000-0000-0000-0000-000000000019"; // ARCHIVADO
// CRM — Agente
const AGENTE_NICO = "c4000000-0000-0000-0000-000000000001";

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
      // Celulares
      { id: COMP_PANT, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Pantalla" },
      { id: COMP_BAT, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Batería" },
      {
        id: COMP_CONECTOR,
        tenant_id: TENANT_ID,
        categoria_id: CAT_CEL,
        nombre: "Conector de carga",
      },
      { id: COMP_CAM_TRAS, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Cámara trasera" },
      { id: COMP_CAM_FRONT, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Cámara frontal" },
      { id: COMP_MIC, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Micrófono" },
      { id: COMP_PARLANTE, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Parlante" },
      { id: COMP_PLACA_CEL, tenant_id: TENANT_ID, categoria_id: CAT_CEL, nombre: "Placa base" },
      // Laptops
      { id: COMP_PLACA, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Placa madre" },
      { id: COMP_PANT_LAP, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Pantalla" },
      { id: COMP_TECLADO, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Teclado" },
      { id: COMP_BAT_LAP, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Batería" },
      { id: COMP_SSD, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Disco SSD" },
      { id: COMP_RAM, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Memoria RAM" },
      { id: COMP_VENT, tenant_id: TENANT_ID, categoria_id: CAT_LAP, nombre: "Ventilador" },
      // Tablets
      { id: COMP_PANT_TAB, tenant_id: TENANT_ID, categoria_id: CAT_TAB, nombre: "Pantalla" },
      { id: COMP_BAT_TAB, tenant_id: TENANT_ID, categoria_id: CAT_TAB, nombre: "Batería" },
      {
        id: COMP_CONECTOR_TAB,
        tenant_id: TENANT_ID,
        categoria_id: CAT_TAB,
        nombre: "Conector de carga",
      },
      { id: COMP_CAM_TAB, tenant_id: TENANT_ID, categoria_id: CAT_TAB, nombre: "Cámara" },
      { id: COMP_PLACA_TAB, tenant_id: TENANT_ID, categoria_id: CAT_TAB, nombre: "Placa base" },
    ])
    .onConflictDoNothing();
  console.log("  [ok] componentes (8 celulares, 7 laptops, 5 tablets)");

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

  // ── Usuarios extra ────────────────────────────────────────────────────────────
  const [cajeroHash, almacenHash] = await Promise.all([
    bcrypt.hash("cajero123", 10),
    bcrypt.hash("almacen123", 10),
  ]);
  await db
    .insert(usuario)
    .values([
      {
        id: USR_CAJERO,
        tenant_id: TENANT_ID,
        sucursal_id: SUCURSAL_ID,
        tipo_documento: "DNI",
        numero_documento: "33445566",
        nombres: "Pedro",
        apellidos: "Cajero",
        rol: "CAJERO",
        password_hash: cajeroHash,
        activo: true,
      },
      {
        id: USR_ALMACEN,
        tenant_id: TENANT_ID,
        sucursal_id: SUCURSAL_ID,
        tipo_documento: "DNI",
        numero_documento: "44556677",
        nombres: "Lucía",
        apellidos: "Almacen",
        rol: "ALMACEN",
        password_hash: almacenHash,
        activo: true,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] usuarios extra (cajero, almacen)");

  // ── Clientes extra ────────────────────────────────────────────────────────────
  await db
    .insert(cliente)
    .values([
      {
        id: CLI_002,
        tenant_id: TENANT_ID,
        tipo_documento: "DNI",
        numero_documento: "56789012",
        tipo_persona: "NATURAL",
        nombres: "Rosa",
        apellidos: "Mamani",
        telefono: "987654321",
        email: "rosa.mamani@gmail.com",
        activo: true,
      },
      {
        id: CLI_003,
        tenant_id: TENANT_ID,
        tipo_documento: "RUC",
        numero_documento: "20987654321",
        tipo_persona: "JURIDICA",
        razon_social: "Empresa Tech EIRL",
        telefono: "014123456",
        activo: true,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] clientes extra");

  // ── Proveedores extra ─────────────────────────────────────────────────────────
  await db
    .insert(proveedor)
    .values({
      id: PROV_002,
      tenant_id: TENANT_ID,
      ruc: "20567890123",
      razon_social: "RepuestosPeru SAC",
      nombre_comercial: "RepuestosPeru",
      distrito: "Comas",
      telefono: "987123456",
      email: "ventas@repuestosperu.com",
      calificacion: 5,
      activo: true,
    })
    .onConflictDoNothing();
  console.log("  [ok] proveedor extra");

  // ── Caja abierta (VENDEDOR) ───────────────────────────────────────────────────
  await db
    .insert(caja)
    .values({
      id: CAJA_ID,
      tenant_id: TENANT_ID,
      sucursal_id: SUCURSAL_ID,
      usuario_id: USR_VENDEDOR,
      monto_inicial: "500.00",
      estado: "ABIERTA",
    })
    .onConflictDoNothing();
  console.log("  [ok] caja abierta");

  // ── Lotes de inventario ───────────────────────────────────────────────────────
  await db
    .insert(lote)
    .values([
      {
        id: LOTE_001,
        tenant_id: TENANT_ID,
        producto_id: PROD_001,
        sucursal_id: SUCURSAL_ID,
        sku: "SAM-PANT-001-1",
        correlativo: 1,
        cantidad_inicial: 10,
        cantidad_actual: 8,
        precio_unitario: "220.00",
        fecha_ingreso: "2026-05-01",
        activo: true,
      },
      {
        id: LOTE_002,
        tenant_id: TENANT_ID,
        producto_id: PROD_002,
        sucursal_id: SUCURSAL_ID,
        sku: "APP-BAT-001-1",
        correlativo: 1,
        cantidad_inicial: 15,
        cantidad_actual: 13,
        precio_unitario: "75.00",
        fecha_ingreso: "2026-05-10",
        activo: true,
      },
      {
        id: LOTE_003,
        tenant_id: TENANT_ID,
        producto_id: PROD_001,
        sucursal_id: SUCURSAL_ID,
        sku: "SAM-PANT-001-2",
        correlativo: 2,
        cantidad_inicial: 5,
        cantidad_actual: 5,
        precio_unitario: "215.00",
        fecha_ingreso: "2026-05-20",
        activo: true,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] lotes de inventario");

  // ── Movimientos de inventario (INGRESO) ───────────────────────────────────────
  await db
    .insert(movimientoInventario)
    .values([
      {
        tenant_id: TENANT_ID,
        producto_id: PROD_001,
        lote_id: LOTE_001,
        sucursal_id: SUCURSAL_ID,
        tipo: "INGRESO",
        cantidad: 10,
        referencia_tipo: "orden_compra",
        usuario_id: USR_ALMACEN,
        notas: "Ingreso inicial lote pantallas Samsung",
      },
      {
        tenant_id: TENANT_ID,
        producto_id: PROD_002,
        lote_id: LOTE_002,
        sucursal_id: SUCURSAL_ID,
        tipo: "INGRESO",
        cantidad: 15,
        referencia_tipo: "orden_compra",
        usuario_id: USR_ALMACEN,
        notas: "Ingreso inicial lote baterías iPhone",
      },
      {
        tenant_id: TENANT_ID,
        producto_id: PROD_001,
        lote_id: LOTE_003,
        sucursal_id: SUCURSAL_ID,
        tipo: "INGRESO",
        cantidad: 5,
        referencia_tipo: "orden_compra",
        usuario_id: USR_ALMACEN,
        notas: "Segundo lote pantallas Samsung",
      },
      {
        tenant_id: TENANT_ID,
        producto_id: PROD_001,
        lote_id: LOTE_001,
        sucursal_id: SUCURSAL_ID,
        tipo: "VENTA",
        cantidad: -2,
        referencia_tipo: "venta",
        usuario_id: USR_VENDEDOR,
        notas: "Salida por ventas",
      },
      {
        tenant_id: TENANT_ID,
        producto_id: PROD_002,
        lote_id: LOTE_002,
        sucursal_id: SUCURSAL_ID,
        tipo: "VENTA",
        cantidad: -2,
        referencia_tipo: "venta",
        usuario_id: USR_VENDEDOR,
        notas: "Salida por ventas",
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] movimientos inventario");

  // ── Ventas con items y pagos ──────────────────────────────────────────────────
  // VENTA_001 — completada (pago total efectivo)
  await db
    .insert(venta)
    .values([
      {
        id: VENTA_001,
        tenant_id: TENANT_ID,
        codigo: "V-0001",
        caja_id: CAJA_ID,
        sucursal_id: SUCURSAL_ID,
        cliente_id: CLI_ID,
        tipo_venta: "LIBRE",
        total: "470.00",
        estado_pago: "COMPLETADA",
        estado_despacho: "SIN_ENVIO",
        created_by: USR_VENDEDOR,
      },
      {
        id: VENTA_002,
        tenant_id: TENANT_ID,
        codigo: "V-0002",
        caja_id: CAJA_ID,
        sucursal_id: SUCURSAL_ID,
        cliente_id: CLI_002,
        tipo_venta: "LIBRE",
        total: "120.00",
        estado_pago: "PAGO_PENDIENTE",
        estado_despacho: "SIN_ENVIO",
        created_by: USR_VENDEDOR,
      },
      {
        id: VENTA_003,
        tenant_id: TENANT_ID,
        codigo: "V-0003",
        caja_id: CAJA_ID,
        sucursal_id: SUCURSAL_ID,
        cliente_id: CLI_ID,
        tipo_venta: "LIBRE",
        total: "350.00",
        estado_pago: "COMPLETADA",
        estado_despacho: "SIN_ENVIO",
        created_by: USR_VENDEDOR,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(ventaItem)
    .values([
      // VENTA_001: pantalla + batería
      {
        tenant_id: TENANT_ID,
        venta_id: VENTA_001,
        tipo_item: "PRODUCTO",
        produto_id: PROD_001,
        lote_id: LOTE_001,
        sku: "SAM-PANT-001-1",
        descripcion: "Pantalla Galaxy S24",
        cantidad: 1,
        precio_unitario: "350.00",
        subtotal: "350.00",
      },
      {
        tenant_id: TENANT_ID,
        venta_id: VENTA_001,
        tipo_item: "PRODUCTO",
        produto_id: PROD_002,
        lote_id: LOTE_002,
        sku: "APP-BAT-001-1",
        descripcion: "Batería iPhone 15",
        cantidad: 1,
        precio_unitario: "120.00",
        subtotal: "120.00",
      },
      // VENTA_002: batería pendiente
      {
        tenant_id: TENANT_ID,
        venta_id: VENTA_002,
        tipo_item: "PRODUCTO",
        produto_id: PROD_002,
        lote_id: LOTE_002,
        sku: "APP-BAT-001-1",
        descripcion: "Batería iPhone 15",
        cantidad: 1,
        precio_unitario: "120.00",
        subtotal: "120.00",
      },
      // VENTA_003: pantalla al contado
      {
        tenant_id: TENANT_ID,
        venta_id: VENTA_003,
        tipo_item: "PRODUCTO",
        produto_id: PROD_001,
        lote_id: LOTE_001,
        sku: "SAM-PANT-001-1",
        descripcion: "Pantalla Galaxy S24",
        cantidad: 1,
        precio_unitario: "350.00",
        subtotal: "350.00",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(ventaPago)
    .values([
      {
        tenant_id: TENANT_ID,
        venta_id: VENTA_001,
        metodo_pago_id: METODO_EFECTIVO,
        caja_id: CAJA_ID,
        monto: "470.00",
        created_by: USR_VENDEDOR,
      },
      {
        tenant_id: TENANT_ID,
        venta_id: VENTA_003,
        metodo_pago_id: METODO_YAPE,
        caja_id: CAJA_ID,
        monto: "350.00",
        created_by: USR_VENDEDOR,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] ventas con items y pagos");

  // ── Cotizaciones de compra (raw SQL para IDs fijos) ───────────────────────────
  await sql`
    INSERT INTO cotizacion_compra (id, tenant_id, codigo, proveedor_id, estado, fecha_solicitud, fecha_respuesta, notas, usuario_id, activo)
    VALUES
      (${COT_C_001}::uuid, ${TENANT_ID}::uuid, 'COT-C-0001', ${PROV_ID}::uuid, 'COTIZADA', '2026-05-28', '2026-05-29', 'Cotización con respuesta — precio aceptado', ${USR_ALMACEN}::uuid, true),
      (${COT_C_002}::uuid, ${TENANT_ID}::uuid, 'COT-C-0002', ${PROV_002}::uuid, 'PENDIENTE', '2026-06-01', NULL, 'Pendiente de respuesta del proveedor', ${USR_ALMACEN}::uuid, true)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO cotizacion_compra_detalle (tenant_id, cotizacion_compra_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES
      (${TENANT_ID}::uuid, ${COT_C_001}::uuid, ${PROD_001}::uuid, 10, 215.00, 2150.00),
      (${TENANT_ID}::uuid, ${COT_C_001}::uuid, ${PROD_002}::uuid, 15, 72.00, 1080.00),
      (${TENANT_ID}::uuid, ${COT_C_002}::uuid, ${PROD_001}::uuid, 5, NULL, NULL)
    ON CONFLICT DO NOTHING
  `;
  console.log("  [ok] cotizaciones de compra");

  // ── Orden de compra (raw SQL para IDs fijos) ──────────────────────────────────
  await sql`
    INSERT INTO orden_compra (id, tenant_id, codigo, proveedor_id, estado, fecha_emision, fecha_entrega_estimada, subtotal, igv, total, notas, usuario_id, activo)
    VALUES (${OC_001}::uuid, ${TENANT_ID}::uuid, 'OC-0001', ${PROV_ID}::uuid, 'GENERADA', '2026-05-30', '2026-06-05', 3230.00, 581.40, 3811.40, 'Generada a partir de COT-C-0001', ${USR_ALMACEN}::uuid, true)
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("  [ok] orden de compra");

  // ── Visitas a domicilio ───────────────────────────────────────────────────────
  await db
    .insert(visitaDomicilio)
    .values([
      {
        id: VD_001,
        tenant_id: TENANT_ID,
        codigo: "VD-0001",
        cliente_id: CLI_ID,
        direccion_id: CLI_DIR_ID,
        direccion_texto: "Av. Universitaria 1234, Los Olivos",
        distrito: "Los Olivos",
        tecnico_id: USR_TECNICO,
        fecha_programada: "2026-06-05",
        hora_inicio: "10:00",
        hora_fin: "11:00",
        estado: "VALIDADA",
        tarifa: "20.00",
        motivo_visita: "Pantalla rota — cliente solicita revisión en domicilio",
      },
      {
        id: VD_002,
        tenant_id: TENANT_ID,
        codigo: "VD-0002",
        cliente_id: CLI_002,
        direccion_texto: "Jr. Las Flores 567, San Martín de Porres",
        distrito: "San Martín de Porres",
        tecnico_id: USR_TECNICO,
        fecha_programada: "2026-06-03",
        hora_inicio: "14:00",
        estado: "ASIGNADA",
        tarifa: "25.00",
        motivo_visita: "Laptop no enciende",
      },
      {
        id: VD_003,
        tenant_id: TENANT_ID,
        codigo: "VD-0003",
        cliente_id: CLI_003,
        direccion_texto: "Av. Túpac Amaru 890, Comas",
        distrito: "Comas",
        fecha_programada: "2026-06-10",
        estado: "POR_VALIDAR",
        tarifa: "30.00",
        motivo_visita: "TV Samsung no tiene imagen",
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] visitas domicilio");

  // ── CRM: Bots (antes de etapas — etapas referencian bot_id) ─────────────────
  await db
    .insert(crmBot)
    .values([
      {
        id: BOT_COT_REP,
        tenant_id: TENANT_ID,
        nombre: "Bot Cotización Repuesto",
        codigo: "COTIZACION_REPUESTO",
        tipo: "COTIZACION_REPUESTO",
        config: {
          pasos: [
            "seleccionar_categoria",
            "seleccionar_componente",
            "buscar_precio",
            "mostrar_resultado",
          ],
        },
        activo: true,
      },
      {
        id: BOT_SRV_PROC,
        tenant_id: TENANT_ID,
        nombre: "Bot Servicio en Proceso",
        codigo: "SERVICIO_PROCESO",
        tipo: "SERVICIO_PROCESO",
        config: {
          pasos: ["pedir_documento", "buscar_servicios", "mostrar_estado"],
        },
        activo: true,
      },
      {
        id: BOT_RECORDATORIO,
        tenant_id: TENANT_ID,
        nombre: "Bot Recordatorio",
        codigo: "RECORDATORIO",
        tipo: "RECORDATORIO",
        config: {
          mensaje: "Hola, ¿pudiste revisar nuestra respuesta anterior?",
          intervalo_horas: 24,
          max_intentos: 3,
        },
        activo: true,
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] crm_bot (3)");

  // ── CRM: Etapas del pipeline (15) ─────────────────────────────────────────────
  await db
    .insert(crmEtapa)
    .values([
      {
        id: ETAPA_01,
        tenant_id: TENANT_ID,
        nombre: "Primer contacto",
        codigo: "PRIMER_CONTACTO",
        orden: 1,
        objetivo: "Saludar, identificar necesidad básica",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#3B82F6",
      },
      {
        id: ETAPA_02,
        tenant_id: TENANT_ID,
        nombre: "Identificación",
        codigo: "IDENTIFICACION",
        orden: 2,
        objetivo: "Capturar nombre y documento del cliente",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#6366F1",
      },
      {
        id: ETAPA_03,
        tenant_id: TENANT_ID,
        nombre: "Captura de equipo",
        codigo: "CAPTURA_EQUIPO",
        orden: 3,
        objetivo: "Capturar categoría, marca, modelo del equipo",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#8B5CF6",
      },
      {
        id: ETAPA_04,
        tenant_id: TENANT_ID,
        nombre: "Captura de falla",
        codigo: "CAPTURA_FALLA",
        orden: 4,
        objetivo: "Capturar descripción detallada de la falla",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#A855F7",
      },
      {
        id: ETAPA_05,
        tenant_id: TENANT_ID,
        nombre: "Captura de ubicación",
        codigo: "CAPTURA_UBICACION",
        orden: 5,
        objetivo: "Capturar ubicación para asignar sucursal",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#D946EF",
      },
      {
        id: ETAPA_06,
        tenant_id: TENANT_ID,
        nombre: "Cotización informal",
        codigo: "COTIZACION_INFORMAL",
        orden: 6,
        objetivo: "Consultar stock/precios, dar cotización orientativa",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#EC4899",
      },
      {
        id: ETAPA_07,
        tenant_id: TENANT_ID,
        nombre: "Decisión del cliente",
        codigo: "DECISION_CLIENTE",
        orden: 7,
        objetivo: "Confirmar si el cliente quiere proceder con reparación",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#F43F5E",
      },
      {
        id: ETAPA_08,
        tenant_id: TENANT_ID,
        nombre: "Registro de cliente",
        codigo: "REGISTRO_CLIENTE",
        orden: 8,
        objetivo: "Buscar/crear cliente en el sistema",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#F97316",
      },
      {
        id: ETAPA_09,
        tenant_id: TENANT_ID,
        nombre: "Registro de servicio",
        codigo: "REGISTRO_SERVICIO",
        orden: 9,
        objetivo:
          "Crear orden de servicio con datos capturados (requiere confirmación del cliente)",
        operador: "IA",
        tiempo_espera_horas: 24,
        color: "#EAB308",
      },
      {
        id: ETAPA_10,
        tenant_id: TENANT_ID,
        nombre: "Derivación a vendedor",
        codigo: "DERIVACION_VENDEDOR",
        orden: 10,
        objetivo: "Vendedor toma control para casos complejos",
        operador: "HUMANO",
        tiempo_espera_horas: 48,
        color: "#22C55E",
      },
      {
        id: ETAPA_11,
        tenant_id: TENANT_ID,
        nombre: "Seguimiento de servicio",
        codigo: "SEGUIMIENTO_SERVICIO",
        orden: 11,
        objetivo: "Cliente consulta estado de su servicio activo",
        operador: "BOT",
        bot_id: BOT_SRV_PROC,
        tiempo_espera_horas: 24,
        color: "#14B8A6",
      },
      {
        id: ETAPA_12,
        tenant_id: TENANT_ID,
        nombre: "Cotización de repuesto",
        codigo: "COTIZACION_REPUESTO",
        orden: 12,
        objetivo: "Flujo guiado para cotizar repuesto específico",
        operador: "BOT",
        bot_id: BOT_COT_REP,
        tiempo_espera_horas: 24,
        color: "#06B6D4",
      },
      {
        id: ETAPA_13,
        tenant_id: TENANT_ID,
        nombre: "Esperando respuesta",
        codigo: "ESPERANDO_RESPUESTA",
        orden: 13,
        objetivo: "Lead no responde, enviar recordatorios (max 3 intentos, 24h entre cada uno)",
        operador: "BOT",
        bot_id: BOT_RECORDATORIO,
        tiempo_espera_horas: 24,
        max_intentos_recordatorio: 3,
        color: "#64748B",
      },
      {
        id: ETAPA_14,
        tenant_id: TENANT_ID,
        nombre: "Convertido",
        codigo: "CONVERTIDO",
        orden: 14,
        objetivo: "Lead se convirtió en cliente con servicio activo",
        operador: "SISTEMA",
        color: "#10B981",
      },
      {
        id: ETAPA_15,
        tenant_id: TENANT_ID,
        nombre: "Sin respuesta",
        codigo: "SIN_RESPUESTA",
        orden: 15,
        objetivo: "Lead no respondió tras N intentos, archivado",
        operador: "SISTEMA",
        color: "#94A3B8",
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] crm_etapa (15)");

  // ── CRM: Transiciones (44) ────────────────────────────────────────────────────
  // Usar raw SQL con ON CONFLICT en (etapa_origen_id, etapa_destino_id)
  const transiciones: Array<[string, string]> = [
    // PRIMER_CONTACTO → ...
    [ETAPA_01, ETAPA_02], // → IDENTIFICACION
    [ETAPA_01, ETAPA_10], // → DERIVACION_VENDEDOR
    [ETAPA_01, ETAPA_12], // → COTIZACION_REPUESTO
    [ETAPA_01, ETAPA_11], // → SEGUIMIENTO_SERVICIO
    // IDENTIFICACION → ...
    [ETAPA_02, ETAPA_03], // → CAPTURA_EQUIPO
    [ETAPA_02, ETAPA_10], // → DERIVACION_VENDEDOR
    // CAPTURA_EQUIPO → ...
    [ETAPA_03, ETAPA_04], // → CAPTURA_FALLA
    [ETAPA_03, ETAPA_10], // → DERIVACION_VENDEDOR
    // CAPTURA_FALLA → ...
    [ETAPA_04, ETAPA_05], // → CAPTURA_UBICACION
    [ETAPA_04, ETAPA_10], // → DERIVACION_VENDEDOR
    // CAPTURA_UBICACION → ...
    [ETAPA_05, ETAPA_06], // → COTIZACION_INFORMAL
    [ETAPA_05, ETAPA_10], // → DERIVACION_VENDEDOR
    // COTIZACION_INFORMAL → ...
    [ETAPA_06, ETAPA_07], // → DECISION_CLIENTE
    [ETAPA_06, ETAPA_10], // → DERIVACION_VENDEDOR
    // DECISION_CLIENTE → ...
    [ETAPA_07, ETAPA_08], // → REGISTRO_CLIENTE
    [ETAPA_07, ETAPA_10], // → DERIVACION_VENDEDOR
    [ETAPA_07, ETAPA_13], // → ESPERANDO_RESPUESTA
    // REGISTRO_CLIENTE → ...
    [ETAPA_08, ETAPA_09], // → REGISTRO_SERVICIO
    [ETAPA_08, ETAPA_10], // → DERIVACION_VENDEDOR
    // REGISTRO_SERVICIO → ...
    [ETAPA_09, ETAPA_14], // → CONVERTIDO
    [ETAPA_09, ETAPA_10], // → DERIVACION_VENDEDOR
    // DERIVACION_VENDEDOR → todas las demás (14)
    [ETAPA_10, ETAPA_01],
    [ETAPA_10, ETAPA_02],
    [ETAPA_10, ETAPA_03],
    [ETAPA_10, ETAPA_04],
    [ETAPA_10, ETAPA_05],
    [ETAPA_10, ETAPA_06],
    [ETAPA_10, ETAPA_07],
    [ETAPA_10, ETAPA_08],
    [ETAPA_10, ETAPA_09],
    [ETAPA_10, ETAPA_11],
    [ETAPA_10, ETAPA_12],
    [ETAPA_10, ETAPA_13],
    [ETAPA_10, ETAPA_14],
    [ETAPA_10, ETAPA_15],
    // SEGUIMIENTO_SERVICIO → ...
    [ETAPA_11, ETAPA_01], // → PRIMER_CONTACTO
    [ETAPA_11, ETAPA_10], // → DERIVACION_VENDEDOR
    // COTIZACION_REPUESTO → ...
    [ETAPA_12, ETAPA_01], // → PRIMER_CONTACTO
    [ETAPA_12, ETAPA_10], // → DERIVACION_VENDEDOR
    [ETAPA_12, ETAPA_07], // → DECISION_CLIENTE
    // ESPERANDO_RESPUESTA → ...
    [ETAPA_13, ETAPA_01], // → PRIMER_CONTACTO
    [ETAPA_13, ETAPA_15], // → SIN_RESPUESTA
    // CONVERTIDO → ...
    [ETAPA_14, ETAPA_01], // → PRIMER_CONTACTO (si vuelve a escribir)
    // SIN_RESPUESTA → ...
    [ETAPA_15, ETAPA_01], // → PRIMER_CONTACTO (si vuelve a escribir)
  ];

  for (const [origen, destino] of transiciones) {
    await sql`
      INSERT INTO crm_etapa_transicion (tenant_id, etapa_origen_id, etapa_destino_id)
      VALUES (${TENANT_ID}::uuid, ${origen}::uuid, ${destino}::uuid)
      ON CONFLICT (etapa_origen_id, etapa_destino_id) DO NOTHING
    `;
  }
  console.log(`  [ok] crm_etapa_transicion (${transiciones.length})`);

  // ── CRM: Etiquetas (19) ───────────────────────────────────────────────────────
  await db
    .insert(crmEtiqueta)
    .values([
      // IDENTIFICACION
      {
        id: ETQ_01,
        tenant_id: TENANT_ID,
        nombre: "Nombre capturado",
        codigo: "NOMBRE_CAPTURADO",
        grupo: "IDENTIFICACION",
        descripcion: "El agente capturó el nombre del cliente",
      },
      {
        id: ETQ_02,
        tenant_id: TENANT_ID,
        nombre: "Documento capturado",
        codigo: "DOCUMENTO_CAPTURADO",
        grupo: "IDENTIFICACION",
        descripcion: "El agente capturó el número de documento",
      },
      {
        id: ETQ_03,
        tenant_id: TENANT_ID,
        nombre: "Celular capturado",
        codigo: "CELULAR_CAPTURADO",
        grupo: "IDENTIFICACION",
        descripcion: "El agente capturó el número de celular",
      },
      {
        id: ETQ_04,
        tenant_id: TENANT_ID,
        nombre: "Ubicación capturada",
        codigo: "UBICACION_CAPTURADA",
        grupo: "IDENTIFICACION",
        descripcion: "El agente capturó la ubicación del cliente",
      },
      // RUTA_ACTIVA
      {
        id: ETQ_05,
        tenant_id: TENANT_ID,
        nombre: "Ruta reparación",
        codigo: "RUTA_REPARACION",
        grupo: "RUTA_ACTIVA",
        descripcion: "El cliente está en el flujo de reparación",
      },
      {
        id: ETQ_06,
        tenant_id: TENANT_ID,
        nombre: "Ruta cotización",
        codigo: "RUTA_COTIZACION",
        grupo: "RUTA_ACTIVA",
        descripcion: "El cliente está en el flujo de cotización",
      },
      {
        id: ETQ_07,
        tenant_id: TENANT_ID,
        nombre: "Ruta consulta estado",
        codigo: "RUTA_CONSULTA_ESTADO",
        grupo: "RUTA_ACTIVA",
        descripcion: "El cliente consulta el estado de un servicio activo",
      },
      {
        id: ETQ_08,
        tenant_id: TENANT_ID,
        nombre: "Ruta información",
        codigo: "RUTA_INFORMACION",
        grupo: "RUTA_ACTIVA",
        descripcion: "El cliente solo pide información general",
      },
      // CAPTURA_DATOS
      {
        id: ETQ_09,
        tenant_id: TENANT_ID,
        nombre: "Equipo identificado",
        codigo: "EQUIPO_IDENTIFICADO",
        grupo: "CAPTURA_DATOS",
        descripcion: "Categoría del equipo capturada",
      },
      {
        id: ETQ_10,
        tenant_id: TENANT_ID,
        nombre: "Falla descrita",
        codigo: "FALLA_DESCRITA",
        grupo: "CAPTURA_DATOS",
        descripcion: "Descripción de la falla capturada",
      },
      {
        id: ETQ_11,
        tenant_id: TENANT_ID,
        nombre: "Marca identificada",
        codigo: "MARCA_IDENTIFICADA",
        grupo: "CAPTURA_DATOS",
        descripcion: "Marca del equipo capturada",
      },
      {
        id: ETQ_12,
        tenant_id: TENANT_ID,
        nombre: "Modelo identificado",
        codigo: "MODELO_IDENTIFICADO",
        grupo: "CAPTURA_DATOS",
        descripcion: "Modelo del equipo capturado",
      },
      {
        id: ETQ_13,
        tenant_id: TENANT_ID,
        nombre: "Cotización enviada",
        codigo: "COTIZACION_ENVIADA",
        grupo: "CAPTURA_DATOS",
        descripcion: "Se envió cotización orientativa al cliente",
      },
      {
        id: ETQ_14,
        tenant_id: TENANT_ID,
        nombre: "Presupuesto aceptado",
        codigo: "PRESUPUESTO_ACEPTADO",
        grupo: "CAPTURA_DATOS",
        descripcion: "El cliente aceptó el presupuesto propuesto",
      },
      // ESTADO_OPERATIVO
      {
        id: ETQ_15,
        tenant_id: TENANT_ID,
        nombre: "Cliente existente",
        codigo: "CLIENTE_EXISTENTE",
        grupo: "ESTADO_OPERATIVO",
        descripcion: "El cliente ya existe en el sistema",
      },
      {
        id: ETQ_16,
        tenant_id: TENANT_ID,
        nombre: "Cliente nuevo",
        codigo: "CLIENTE_NUEVO",
        grupo: "ESTADO_OPERATIVO",
        descripcion: "El cliente fue creado en este flujo",
      },
      {
        id: ETQ_17,
        tenant_id: TENANT_ID,
        nombre: "Servicio creado",
        codigo: "SERVICIO_CREADO",
        grupo: "ESTADO_OPERATIVO",
        descripcion: "Se creó una orden de servicio para el lead",
      },
      {
        id: ETQ_18,
        tenant_id: TENANT_ID,
        nombre: "Derivado a vendedor",
        codigo: "DERIVADO_VENDEDOR",
        grupo: "ESTADO_OPERATIVO",
        descripcion: "El lead fue derivado a un vendedor humano",
      },
      {
        id: ETQ_19,
        tenant_id: TENANT_ID,
        nombre: "Archivado",
        codigo: "ARCHIVADO",
        grupo: "ESTADO_OPERATIVO",
        descripcion: "Lead sin respuesta, archivado automáticamente",
      },
    ])
    .onConflictDoNothing();
  console.log("  [ok] crm_etiqueta (19)");

  // ── CRM: Agente Nico ──────────────────────────────────────────────────────────
  await db
    .insert(crmAgente)
    .values({
      id: AGENTE_NICO,
      tenant_id: TENANT_ID,
      nombre: "Nico",
      canal: "WHATSAPP",
      modelo_ia: "claude-haiku-4-5-20251001",
      tono: "Amigable, directo y profesional. Usa el tuteo. Responde en español peruano.",
      max_mensajes_contexto: 20,
      activo: true,
    })
    .onConflictDoNothing();
  console.log("  [ok] crm_agente (Nico)");

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
