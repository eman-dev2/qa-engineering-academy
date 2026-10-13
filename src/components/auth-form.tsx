"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, requestPasswordReset, resetPassword, signup } from "@/app/actions/auth";
import type { FormState } from "@/lib/auth/validation";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type AuthText = Dictionary["auth"];
import { Field, FormMessage } from "./form";
import { buttonClass } from "./ui";

const link = "font-semibold text-pen underline underline-offset-2";

export function AuthForm({ mode, next, locale, t }: { mode: "login" | "signup"; next: string; locale: Locale; t: AuthText }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : signup, {});
  const L = (p: string) => localePath(locale, p);
  const other = mode === "login" ? L("/signup") : L("/login");
  const nextQuery = next !== L("/dashboard") ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      {mode === "signup" && <Field name="name" label={t.name} autoComplete="name" state={state} />}
      <Field name="email" label={t.email} type="email" autoComplete="email" state={state} />
      <Field
        name="password"
        label={t.password}
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        hint={mode === "signup" ? t.passwordHint : undefined}
        state={state}
      />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? (mode === "login" ? t.loggingIn : t.signingUp) : mode === "login" ? t.loginButton : t.signupButton}
      </button>
      {mode === "login" && (
        <p className="text-sm">
          <Link href={L("/forgot-password")} className={link}>
            {t.forgot}
          </Link>
        </p>
      )}
      <p className="text-sm text-ink-2">
        {mode === "login" ? t.newHere : t.haveAccount}{" "}
        <Link href={`${other}${nextQuery}`} className={link}>
          {mode === "login" ? t.createAccount : t.logInInstead}
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm({ locale, t, devOutbox }: { locale: Locale; t: AuthText; devOutbox: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  const L = (p: string) => localePath(locale, p);
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      {state.ok && devOutbox && (
        <p className="text-sm text-ink-2">
          {t.devOutboxNote.split("{outbox}")[0]}
          <Link href={L("/dev/outbox")} className={link}>
            {t.devOutbox}
          </Link>
          {t.devOutboxNote.split("{outbox}")[1]}
        </p>
      )}
      <Field name="email" label={t.email} type="email" autoComplete="email" state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? t.sending : t.sendLink}
      </button>
      <p className="text-sm">
        <Link href={L("/login")} className={link}>
          {t.backToLogin}
        </Link>
      </p>
    </form>
  );
}

export function ResetForm({ token, locale, t }: { token: string; locale: Locale; t: AuthText & { saving: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="token" value={token} />
      <FormMessage state={state} />
      <Field name="password" label={t.newPassword} type="password" autoComplete="new-password" hint={t.passwordHint} state={state} />
      <Field name="confirm" label={t.confirmPassword} type="password" autoComplete="new-password" state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        {pending ? t.saving : t.resetButton}
      </button>
    </form>
  );
}
