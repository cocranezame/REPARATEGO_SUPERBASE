require("dotenv").config({ path: "../../.env" });
require("tsx/cjs");

const { getDb } = require("./src/lib/db.ts");
const { caja, cotizacionVenta, cliente, usuario } = require("@kallpasoft/db");
const { and, asc, count, eq, sql } = require("drizzle-orm");

const db = getDb();
const tenantId = "a0000000-0000-0000-0000-000000000001";
const userId = "a0000000-0000-0000-0000-000000000010";

async function main() {
  console.log("=== TEST 1: requireCajaAbierta check ===");
  try {
    const rows = await db
      .select({ id: caja.id })
      .from(caja)
      .where(
        and(eq(caja.tenant_id, tenantId), eq(caja.usuario_id, userId), eq(caja.estado, "ABIERTA"))
      )
      .limit(1);
    console.log("Caja rows:", JSON.stringify(rows));
    if (!rows[0]) console.log("=> Admin has NO open caja, middleware returns 403");
    else console.log("=> Caja found:", rows[0].id);
  } catch (err) {
    console.error("FAIL:", err.message);
  }

  console.log("\n=== TEST 2: cotizacionVenta list query ===");
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL app.tenant_id = '${sql.raw(tenantId)}'`);
      const conditions = [eq(cotizacionVenta.tenant_id, tenantId)];
      const where = and(...conditions);
      const [countRows, rows] = await Promise.all([
        tx.select({ total: count() }).from(cotizacionVenta).where(where),
        tx
          .select({
            cot: cotizacionVenta,
            usuario_nombres: usuario.nombres,
            usuario_apellidos: usuario.apellidos,
            cliente_nombres: cliente.nombres,
            cliente_apellidos: cliente.apellidos,
            cliente_razon_social: cliente.razon_social,
          })
          .from(cotizacionVenta)
          .leftJoin(usuario, eq(cotizacionVenta.created_by, usuario.id))
          .leftJoin(cliente, eq(cotizacionVenta.cliente_id, cliente.id))
          .where(where)
          .orderBy(asc(cotizacionVenta.created_at))
          .limit(20)
          .offset(0),
      ]);
      return { items: rows, total: countRows[0]?.total ?? 0 };
    });
    console.log("OK - total:", result.total, "items:", result.items.length);
  } catch (err) {
    console.error("FAIL:", err.message, "\n", err.stack);
  }
}

main().finally(() => process.exit(0));
