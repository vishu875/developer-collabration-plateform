import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config();

// Same sslmode workaround as drizzle.config.ts and src/lib/db/index.ts —
// Supabase's pooler cert chain fails default verification.
const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const connectionString = rawUrl.split("?")[0];

async function main() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
  console.log("Migrations applied successfully.");

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
