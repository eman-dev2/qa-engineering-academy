import "server-only";
import { getDb, schema } from "@/lib/db";

/**
 * Email delivery boundary.
 *
 * Implemented: the "outbox" transport. Messages are stored in the database (readable at /dev/outbox
 * in development) and written to the server log.
 *
 * Not implemented: a production email provider. To send real email, add a transport here (for example
 * Resend or Postmark over HTTPS) selected by an environment variable and configured with its API key.
 * Until then, password-reset links only appear in the outbox and in the server log.
 */
export type Mail = { to: string; subject: string; text: string };

export async function sendMail(mail: Mail): Promise<void> {
  getDb()
    .insert(schema.emailOutbox)
    .values({ to: mail.to, subject: mail.subject, text: mail.text, createdAt: new Date() })
    .run();
  if (process.env.NODE_ENV !== "test") {
    console.info(`[mail:outbox] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
  }
}

/**
 * The outbox page shows reset links, so it must never be reachable on a public deployment:
 * it exists only when NODE_ENV is not "production".
 */
export function devOutboxEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
