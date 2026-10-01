// Server-only access to the database (Turso / libSQL) and settings.
// Exposes a small D1-compatible API so the store code stays platform-neutral.
import { createClient, type Client, type InArgs } from "@libsql/client";

type Row = Record<string, unknown>;

class Stmt {
  constructor(private client: Client, readonly sql: string, readonly args: unknown[] = []) {}
  bind(...args: unknown[]) {
    return new Stmt(this.client, this.sql, args);
  }
  private async exec() {
    const r = await this.client.execute({ sql: this.sql, args: this.args as InArgs });
    const rows = r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, (row as unknown as unknown[])[i]])) as Row);
    return { r, rows };
  }
  async all<T = Row>(): Promise<{ results: T[] }> {
    const { rows } = await this.exec();
    return { results: rows as T[] };
  }
  async first<T = Row>(): Promise<T | null> {
    const { rows } = await this.exec();
    return (rows[0] as T) ?? null;
  }
  async run(): Promise<{ meta: { last_row_id: number; changes: number } }> {
    const { r } = await this.exec();
    return { meta: { last_row_id: Number(r.lastInsertRowid ?? 0), changes: r.rowsAffected } };
  }
}

export class Db {
  constructor(private client: Client) {}
  prepare(sql: string) {
    return new Stmt(this.client, sql);
  }
  async batch(stmts: Stmt[]) {
    return this.client.batch(stmts.map((s) => ({ sql: s.sql, args: s.args as InArgs })), "write");
  }
}

let cached: Db | undefined;

export function bindings(): { DB?: Db; ADMIN_PASSWORD?: string } {
  const url = process.env.TURSO_DATABASE_URL;
  if (!cached && url) cached = new Db(createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }));
  return { DB: cached, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD };
}
