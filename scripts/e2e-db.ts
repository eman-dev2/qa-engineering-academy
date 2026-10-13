/**
 * Fresh, seeded database for the end-to-end tests (run by the Playwright web server command).
 * Uses DATABASE_PATH (./data/e2e.db in playwright.config.ts), never the development database.
 */
import fs from "node:fs";
import { databaseFile, openDatabase } from "../src/lib/db/connection";
import { seedContent, seedDemo, assertNotProduction } from "../seed/lib";

async function main() {
  assertNotProduction("The e2e database script");
  const file = databaseFile();
  if (!/e2e/.test(file)) throw new Error(`Refusing to reset ${file}: set DATABASE_PATH to an e2e database.`);
  for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(`${file}${suffix}`, { force: true });
  const { db, sqlite } = openDatabase(file);
  seedContent(db);
  await seedDemo(db);
  sqlite.close();
  console.log(`[e2e] fresh database: ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
