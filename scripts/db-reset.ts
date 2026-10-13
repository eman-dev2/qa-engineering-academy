/**
 * Delete the local database file and rebuild it from migrations and seed data.
 *
 *   npm run db:reset -- --yes
 *
 * Refused when NODE_ENV=production. Every account, progress record and admin edit in the
 * file is lost, which is why --yes is required.
 */
import fs from "node:fs";
import { databaseFile, openDatabase } from "../src/lib/db/connection";
import { seedContent, seedDemo, assertNotProduction } from "../seed/lib";

async function main() {
  assertNotProduction("db:reset");
  const file = databaseFile();
  if (!process.argv.includes("--yes")) {
    console.error(`This deletes ${file} and everything in it. Re-run with --yes to confirm:\n\n  npm run db:reset -- --yes\n`);
    process.exit(1);
  }
  for (const f of [file, `${file}-wal`, `${file}-shm`]) {
    if (fs.existsSync(f)) fs.rmSync(f);
  }
  const { db, sqlite } = openDatabase(file);
  console.table(seedContent(db));
  const { created } = await seedDemo(db, { log: (m) => console.log(m) });
  console.log(`Database rebuilt: ${file} (${created} demo accounts).`);
  sqlite.close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
