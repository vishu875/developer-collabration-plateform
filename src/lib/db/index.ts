import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Strip query params (e.g. `sslmode=require`) so the `ssl` option below is
// authoritative — pg's connection-string parser otherwise treats a
// `sslmode` param as `verify-full` and ignores `rejectUnauthorized: false`,
// which breaks against Supabase's pooler cert chain. Same workaround as
// drizzle.config.ts uses for migrations.
const connectionString = (process.env.DATABASE_URL || "").split("?")[0];

const poolConfig = {
  connectionString,
  ssl: { rejectUnauthorized: false },
};

declare global {
  var db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool(poolConfig);
  dbInstance = drizzle(pool, { schema });
} else {
  if (!global.db) {
    const pool = new Pool(poolConfig);
    global.db = drizzle(pool, { schema });
  }
  dbInstance = global.db;
}

export const db = dbInstance;
