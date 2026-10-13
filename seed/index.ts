/**
 * Load seed data.
 *
 *   npm run db:seed                       content (insert missing only) + demo accounts (development only)
 *   npm run db:seed -- --content-only     content only (safe in any environment)
 *   npm run db:seed -- --demo-only        demo accounts only
 *   npm run db:seed -- --reset-demo       delete demo accounts (and their progress) and recreate them
 *   npm run db:seed -- --force-content    overwrite content rows from the seed files (discards admin edits!)
 */
import { openDatabase, databaseFile } from "../src/lib/db/connection";
import { seedContent, seedDemo, DEFAULT_DEMO_PASSWORD, demoAccounts } from "./lib";

const args = new Set(process.argv.slice(2));
const contentOnly = args.has("--content-only");
const demoOnly = args.has("--demo-only");
const forceContent = args.has("--force-content");
const resetDemo = args.has("--reset-demo");

async function main() {
  const file = databaseFile();
  console.log(`Database: ${file}`);
  const { db, sqlite } = openDatabase(file);

  if (!demoOnly) {
    if (forceContent) console.warn("--force-content: content rows will be overwritten from the seed files.");
    console.table(seedContent(db, { forceContent }));
  }

  if (!contentOnly) {
    if (process.env.NODE_ENV === "production") {
      console.log("NODE_ENV=production: demo accounts skipped (they are development-only).");
    } else {
      const { created } = await seedDemo(db, { reset: resetDemo, log: (m) => console.log(m) });
      if (created > 0 || resetDemo) {
        const pw = process.env.DEMO_PASSWORD ? "(the value of DEMO_PASSWORD)" : DEFAULT_DEMO_PASSWORD;
        console.log(`\nDevelopment demo accounts (password: ${pw}):`);
        for (const a of demoAccounts) console.log(`  ${a.email.padEnd(40)} ${a.roles.join(", ")}`);
      }
    }
  }
  sqlite.close();
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
