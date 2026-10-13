import { z } from "zod";

/** Error message set (one per language, from the dictionaries). */
export type AuthErrors = {
  nameShort: string;
  nameLong: string;
  email: string;
  passwordShort: string;
  passwordLong: string;
  passwordMix: string;
  passwordRequired: string;
  passwordMismatch: string;
};

/** English defaults, used by CLI scripts and tests. */
export const defaultAuthErrors: AuthErrors = {
  nameShort: "Enter your name (at least 2 characters).",
  nameLong: "Use 80 characters or fewer.",
  email: "Enter a valid email address.",
  passwordShort: "Use at least 10 characters.",
  passwordLong: "Use 200 characters or fewer.",
  passwordMix: "Include at least one letter and one number.",
  passwordRequired: "Enter your password.",
  passwordMismatch: "The two passwords don't match.",
};

const nameField = (e: AuthErrors) => z.string().trim().min(2, e.nameShort).max(80, e.nameLong);
const emailField = (e: AuthErrors) => z.string().trim().toLowerCase().pipe(z.email(e.email));
export const newPasswordField = (e: AuthErrors) =>
  z
    .string()
    .min(10, e.passwordShort)
    .max(200, e.passwordLong)
    .refine((v) => /\p{L}/u.test(v) && /\p{N}/u.test(v), e.passwordMix);

export const signupSchemaFor = (e: AuthErrors) => z.object({ name: nameField(e), email: emailField(e), password: newPasswordField(e) });

export const loginSchemaFor = (e: AuthErrors) => z.object({ email: emailField(e), password: z.string().min(1, e.passwordRequired) });

export const emailOnlySchemaFor = (e: AuthErrors) => z.object({ email: emailField(e) });

export const resetSchemaFor = (e: AuthErrors) =>
  z
    .object({ token: z.string().min(20), password: newPasswordField(e), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: e.passwordMismatch, path: ["confirm"] });

export const profileSchemaFor = (e: AuthErrors) =>
  z.object({ name: nameField(e), email: emailField(e), preferredLocale: z.enum(["en", "ar"]) });

export const changePasswordSchemaFor = (e: AuthErrors) =>
  z
    .object({ current: z.string().min(1, e.passwordRequired), password: newPasswordField(e), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: e.passwordMismatch, path: ["confirm"] });

// English schemas (used by scripts and unit tests).
export const signupSchema = signupSchemaFor(defaultAuthErrors);
export const loginSchema = loginSchemaFor(defaultAuthErrors);

export type FieldErrors = Partial<Record<string, string[]>>;

export type FormState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

/** Only allow same-site relative redirects (prevents open redirects via ?next=). */
export function safeNext(next: unknown, fallback = "/dashboard"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
