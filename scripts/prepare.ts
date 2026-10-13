/**
 * Runs before `next dev`, `next build` and `next start`:
 *
 *   1. applies database migrations (creates ./data/academy.db on first run),
 *   2. inserts any seed content that is missing (never overwrites existing rows),
 *   3. with --demo and outside production, creates the development demo accounts,
 *   4. if no administrator exists and ADMIN_EMAIL + ADMIN_PASSWORD are set in the server's
 *      environment, creates the first administrator.
 *
 * Nothing here is reachable from the browser.
 */
import { openDatabase, databaseFile } from "../src/lib/db/connection";
import { adminCount, createAdministrator } from "../src/lib/auth/bootstrap";
import { seedContent, seedDemo } from "../seed/lib";

const args = new Set(process.argv.slice(2));
const quiet = args.has("--quiet");
const log = (m: string) => {
  if (!quiet) console.log(`[prepare] ${m}`);
};

async function main() {
  const file = databaseFile();
  const { db, sqlite } = openDatabase(file);
  log(`database ready: ${file}`);

  const report = seedContent(db);
  const inserted = Object.values(report).reduce((n, r) => n + r.inserted, 0);
  log(inserted > 0 ? `seed content: ${inserted} new rows inserted` : "seed content: up to date");

  if (args.has("--demo") && process.env.NODE_ENV !== "production") {
    const { created } = await seedDemo(db);
    if (created > 0) log(`demo accounts created: ${created} (see README, "Demo accounts")`);
  }

  if (adminCount(db) === 0) {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      const result = await createAdministrator(db, { email, password, name: process.env.ADMIN_NAME ?? "Administrator" });
      log(`administrator ${result.status}: ${result.email}`);
    } else if (process.env.NODE_ENV === "production") {
      log("no administrator yet: set ADMIN_EMAIL and ADMIN_PASSWORD, or run `npm run admin:create`.");
    }
  }
  sqlite.close();
}

main().catch((err) => {
  console.error(`[prepare] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
