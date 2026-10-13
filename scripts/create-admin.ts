/**
 * Create the first administrator from the server's command line.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name"
 *
 * The password is read from ADMIN_PASSWORD if set, otherwise prompted for (input hidden).
 * Refuses when an administrator already exists, unless --additional is passed. Further
 * administrators are normally granted from the admin area or with `npm run user:role`.
 */
import { openDatabase } from "../src/lib/db/connection";
import { adminCount, createAdministrator } from "../src/lib/auth/bootstrap";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      reject(new Error("No terminal for a password prompt. Set ADMIN_PASSWORD instead."));
      return;
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    const onData = (ch: string) => {
      if (ch === "\r" || ch === "\n" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off("data", onData);
        process.stdout.write("\n");
        resolve(value);
      } else if (ch === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      } else if (ch === "\u007f" || ch === "\b") {
        value = value.slice(0, -1);
      } else {
        value += ch;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const email = arg("email");
  const name = arg("name") ?? "Administrator";
  if (!email) {
    console.error('Usage: npm run admin:create -- --email you@example.com --name "Your Name"');
    process.exit(1);
  }
  const { db, sqlite } = openDatabase();
  try {
    if (adminCount(db) > 0 && !process.argv.includes("--additional")) {
      console.error("An administrator already exists. Grant the role from the admin area, or pass --additional.");
      process.exit(1);
    }
    let password = process.env.ADMIN_PASSWORD;
    if (!password) {
      password = await promptHidden("Password (10+ characters, letters and numbers): ");
      const again = await promptHidden("Repeat password: ");
      if (password !== again) throw new Error("Passwords don't match.");
    }
    const result = await createAdministrator(db, { email, name, password });
    console.log(`Administrator ${result.status}: ${result.email}`);
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
