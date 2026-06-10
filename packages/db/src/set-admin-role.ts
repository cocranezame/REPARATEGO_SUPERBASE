import { config } from "dotenv";

config({ path: "../../.env" });

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { usuario } from "./schema/index.js";

const DNI = "12345678";

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definido en .env");

  const pg = postgres(url, { max: 1 });
  const db = drizzle(pg);

  const result = await db
    .update(usuario)
    .set({ rol: "ADMIN", updated_at: new Date() })
    .where(eq(usuario.numero_documento, DNI))
    .returning({ id: usuario.id, nombres: usuario.nombres, rol: usuario.rol });

  if (result.length === 0) {
    console.error(`✗ No se encontró ningún usuario con DNI ${DNI}`);
  } else {
    const row = result[0];
    if (row) {
      console.log(`✓ Rol actualizado a ADMIN para: ${row.nombres} (id: ${row.id})`);
    }
  }

  await pg.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
