import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type DB = BetterSQLite3Database<typeof schema>;

export function databaseFile(): string {
  // The database location is runtime configuration, not a source file: keep it out of build tracing.
  return path.resolve(/*turbopackIgnore: true*/ process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "academy.db"));
}

/** Open (creating if needed) and migrate the SQLite database. Used by the app and by CLI scripts. */
export function openDatabase(file = databaseFile()): { db: DB; sqlite: Database.Database } {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema });
  // Migrations are idempotent, so running them on open keeps setup to one command.
  migrate(db, { migrationsFolder: path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle") });
  return { db, sqlite };
}
