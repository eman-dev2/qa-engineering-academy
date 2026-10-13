"use client";

import { useActionState, useId } from "react";
import { changePassword, deleteAccount, logoutOtherSessions, updateProfile } from "@/app/actions/auth";
import type { FormState } from "@/lib/auth/validation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Field, FormMessage } from "./form";
import { buttonClass } from "./ui";

type Text = { auth: Dictionary["auth"]; account: Dictionary["account"]; common: Dictionary["common"] };

export function ProfileForm({ locale, t, user }: { locale: Locale; t: Text; user: { name: string; email: string; preferredLocale: Locale } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  const langId = useId();
  const current = state.values?.preferredLocale ?? user.preferredLocale;
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      <Field name="name" label={t.auth.name} autoComplete="name" state={state} defaultValue={user.name} />
      <Field name="email" label={t.auth.email} type="email" autoComplete="email" state={state} defaultValue={user.email} />
      <Field name="current" label={t.account.currentPasswordForEmail} type="password" autoComplete="current-password" state={state} required={false} />
      <div>
        <label htmlFor={langId} className="block font-medium">
          {t.account.preferredLanguage}
        </label>
        <select
          id={langId}
          name="preferredLocale"
          defaultValue={current}
          key={current}
          className="mt-1.5 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-ink"
        >
          <option value="en">{t.account.langEn}</option>
          <option value="ar">{t.account.langAr}</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? t.common.saving : t.account.saveProfile}
      </button>
    </form>
  );
}

export function PasswordForm({ locale, t }: { locale: Locale; t: Text }) {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} noValidate className="space-y-5" key={state.ok ? "done" : "form"}>
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      <Field name="current" label={t.account.currentPassword} type="password" autoComplete="current-password" state={state} />
      <Field name="password" label={t.auth.newPassword} type="password" autoComplete="new-password" hint={t.auth.passwordHint} state={state} />
      <Field name="confirm" label={t.auth.confirmPassword} type="password" autoComplete="new-password" state={state} />
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        {pending ? t.common.saving : t.account.changePassword}
      </button>
    </form>
  );
}

export function SessionsForm({ locale, t, disabled }: { locale: Locale; t: Text; disabled: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logoutOtherSessions, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      <button type="submit" disabled={pending || disabled} className={buttonClass("secondary")}>
        {t.account.logoutOthers}
      </button>
    </form>
  );
}

export function DeleteAccountForm({ locale, t }: { locale: Locale; t: Text }) {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  return (
    <form action={action} noValidate className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <FormMessage state={state} />
      <Field name="password" label={t.account.deleteConfirm} type="password" autoComplete="current-password" state={state} />
      <button type="submit" disabled={pending} className={buttonClass("danger")}>
        {t.account.deleteButton}
      </button>
    </form>
  );
}
