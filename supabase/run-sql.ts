/**
 * Runs rls.sql and seed.sql against the Supabase Postgres database.
 * (schema.sql already ran successfully — this picks up from rls.sql)
 *
 *   DB_PASSWORD='...' npx tsx supabase/run-sql.ts
 */
import { Client } from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "akvxwcnrpdjctkvpupxx";

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function run(label: string, file: string) {
  const sql = readFileSync(join(__dirname, file), "utf8");
  console.log(`Running ${label}…`);
  await client.query(sql);
  console.log(`  Done.`);
}

async function main() {
  await client.connect();
  console.log("Connected.\n");
  await run("rls.sql", "rls.sql");
  await run("seed.sql", "seed.sql");
  await client.end();
  console.log("\nAll done.");
}

main().catch((err) => { console.error(err.message); process.exit(1); });
