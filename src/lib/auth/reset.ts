import "server-only";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashToken } from "./session";

/** Check a password-reset token without using it (for deciding whether to show the form). */
export function isResetTokenValid(token: string): boolean {
  if (!token || token.length < 20) return false;
  const row = getDb()
    .select({ id: schema.passwordResetTokens.id })
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.id, hashToken(token)),
        isNull(schema.passwordResetTokens.usedAt),
        gt(schema.passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .get();
  return !!row;
}
