"use client";

import { useId, type ReactNode } from "react";
import type { FormState } from "@/lib/auth/validation";
import { cx } from "./ui";

/** Labelled input with hint and error text wired up for assistive technology. */
export function Field({
  name,
  label,
  type = "text",
  autoComplete,
  hint,
  state,
  defaultValue,
  required = true,
  dir,
  className,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  state: FormState;
  defaultValue?: string;
  required?: boolean;
  dir?: "ltr" | "rtl" | "auto";
  className?: string;
}) {
  const id = useId();
  const errors = state.fieldErrors?.[name];
  const describedBy = [hint && `${id}-hint`, errors && `${id}-err`].filter(Boolean).join(" ") || undefined;
  const value = type === "password" ? undefined : (state.values?.[name] ?? defaultValue);
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-ink-3">
          {hint}
        </p>
      )}
      <input
        id={id}
        name={name}
        type={type}
        dir={dir ?? (type === "email" || type === "password" ? "ltr" : undefined)}
        autoComplete={autoComplete}
        defaultValue={value}
        aria-invalid={!!errors}
        aria-describedby={describedBy}
        required={required}
        className={cx("mt-1.5 h-11 w-full rounded-md border bg-surface px-3 text-ink", errors ? "border-fail" : "border-line-strong")}
      />
      {errors && (
        <p id={`${id}-err`} className="mt-1 text-sm text-fail">
          {errors[0]}
        </p>
      )}
    </div>
  );
}

/** Form-level status: an alert for errors, a polite status for success. */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;
  if (state.ok) {
    return (
      <p role="status" className="rounded-md border border-pass/50 bg-pass-soft px-4 py-3 text-sm text-pass">
        {state.message}
      </p>
    );
  }
  return (
    <p role="alert" className="rounded-md border border-fail/50 bg-fail-soft px-4 py-3 text-sm text-fail">
      {state.message}
    </p>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-lg border border-line bg-surface p-6 sm:p-8", className)}>{children}</div>;
}
