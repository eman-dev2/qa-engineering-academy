"use client";

import { useActionState, useTransition, type ReactNode } from "react";
import type { AdminState } from "@/app/actions/admin";
import { buttonClass, cx } from "@/components/ui";

type Action = (prev: AdminState, form: FormData) => Promise<AdminState>;

/**
 * Wrapper for admin forms whose fields are rendered on the server. Submitting through the
 * handler (instead of the form action prop) keeps what the editor typed when validation fails:
 * React resets uncontrolled fields after a form action, which would throw edits away.
 * Without JavaScript the form still posts to the same server action.
 */
export function AdminForm({
  action,
  locale,
  children,
  submitLabel,
  pendingLabel,
  className,
  secondary,
}: {
  action: Action;
  locale: string;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel: string;
  className?: string;
  /** Extra submit buttons (name="intent") rendered next to the main one. */
  secondary?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(action, {});
  const [, start] = useTransition();
  return (
    <form
      action={formAction}
      noValidate
      className={cx("space-y-6", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const data = new FormData(e.currentTarget, submitter);
        start(() => formAction(data));
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <Status state={state} />
      {children}
      {(submitLabel || secondary) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {submitLabel && (
            <button type="submit" disabled={pending} className={buttonClass("primary")}>
              {pending ? pendingLabel : submitLabel}
            </button>
          )}
          {secondary}
        </div>
      )}
      {(submitLabel || secondary) && state.message && <Status state={state} compact />}
    </form>
  );
}

function Status({ state, compact = false }: { state: AdminState; compact?: boolean }) {
  if (!state.message) return null;
  if (state.ok) {
    return (
      <p role={compact ? undefined : "status"} className="rounded-md border border-pass/50 bg-pass-soft px-4 py-3 text-sm text-pass">
        {state.message}
      </p>
    );
  }
  return (
    <div role={compact ? undefined : "alert"} className="rounded-md border border-fail/50 bg-fail-soft px-4 py-3 text-sm text-fail">
      <p className="font-semibold">{state.message}</p>
      {!compact && state.errors && state.errors.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 ps-5">
          {state.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
