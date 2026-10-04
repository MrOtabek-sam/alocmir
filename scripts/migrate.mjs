// Applies every SQL file in migrations/ to your Turso database, then adds the bundled blog posts.
// Safe to run repeatedly: tables are created only if missing and existing rows are never overwritten.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate
// The build runs it with --if-configured, so a Vercel deploy migrates automatically when the database is set.
import { readdirSync, readFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { seedBlog } from "./blog-seed.mjs";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  if (process.argv.includes("--if-configured")) {
    console.log("TURSO_DATABASE_URL not set: skipping database migration.");
    process.exit(0);
  }
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first. See README.md.");
  process.exit(1);
}
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
// Each migration runs once per database, so data changes (prices, products) don't overwrite later edits in the admin.
await db.execute("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (datetime('now')))");
const done = new Set((await db.execute("SELECT name FROM _migrations")).rows.map((r) => r.name));
for (const f of readdirSync("migrations").filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(f)) continue;
  await db.executeMultiple(readFileSync(`migrations/${f}`, "utf8"));
  await db.execute({ sql: "INSERT INTO _migrations (name) VALUES (?)", args: [f] });
  console.log("applied", f);
}
const added = await seedBlog(db);
console.log(added ? `added ${added} blog posts (scheduled)` : "blog posts already present");
console.log("Database ready.");
