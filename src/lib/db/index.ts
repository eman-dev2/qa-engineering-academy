import "server-only";
import { openDatabase, type DB } from "./connection";
import * as schema from "./schema";

// Reuse one connection per server process (and across dev hot reloads).
const globalForDb = globalThis as unknown as { __academyDb?: DB };

export function getDb(): DB {
  if (!globalForDb.__academyDb) globalForDb.__academyDb = openDatabase().db;
  return globalForDb.__academyDb;
}

export type { DB };
export { schema };
