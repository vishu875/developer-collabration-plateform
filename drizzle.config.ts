import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
dotenv.config();

// Strip any sslmode parameters that override node-postgres options
const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.split("?")[0];

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
