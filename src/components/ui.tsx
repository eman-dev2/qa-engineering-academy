import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ExternalIcon } from "./icons";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("mx-auto w-full max-w-[76rem] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

type Variant = "primary" | "secondary" | "quiet" | "danger";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold text-[0.95rem] leading-none transition-colors disabled:opacity-55 disabled:cursor-not-allowed min-h-11 px-4";

const variants: Record<Variant, string> = {
  primary: "bg-pen text-on-pen hover:bg-pen-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink hover:bg-surface-2",
  quiet: "text-pen hover:text-pen-hover hover:bg-pen-soft px-3",
  danger: "border border-fail/60 bg-surface text-fail hover:bg-fail-soft",
};

export function buttonClass(variant: Variant = "primary", className?: string) {
  return cx(buttonBase, variants[variant], className);
}

export function Button({ variant = "primary", className, ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

/** Safe external link: new tab, no opener, no referrer, with a visible and announced indicator. */
export function ExternalLink({
  href,
  children,
  className,
  newTabLabel,
  showIcon = true,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  /** Screen-reader text, e.g. "(opens in a new tab)" in the page language. */
  newTabLabel: string;
  showIcon?: boolean;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      {showIcon && <ExternalIcon className="ms-1 inline-block -translate-y-px align-middle" />}
      <span className="sr-only"> {newTabLabel}</span>
    </a>
  );
}

export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cx("text-pen underline decoration-1 underline-offset-[0.18em] hover:text-pen-hover hover:decoration-2", className)}
      {...props}
    />
  );
}

export function PageHeading({ title, lead, children }: { title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <header className="border-b border-line pb-8 pt-10 sm:pt-14">
      <h1 className="max-w-[24ch] text-[2.1rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.9rem]">{title}</h1>
      {lead && <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-ink-2">{lead}</p>}
      {children}
    </header>
  );
}

/** Level progression shown as an interval: [Beginner, Junior]. Brackets mirror in RTL. */
export function LevelRange({ from, to, label, rtl = false }: { from: string; to: string; label: string; rtl?: boolean }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-sm text-ink-2" role="img" aria-label={label}>
      <span aria-hidden className="font-semibold text-ink-3">{rtl ? "]" : "["}</span>
      <span aria-hidden className="font-medium text-ink">{from}</span>
      <span aria-hidden className="text-ink-3">{rtl ? "،" : ","}</span>
      <span aria-hidden className="font-medium text-ink">{to}</span>
      <span aria-hidden className="font-semibold text-ink-3">{rtl ? "[" : "]"}</span>
    </span>
  );
}

export function ProgressBar({ value, max, label, valueText }: { value: number; max: number; label: string; valueText: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
    >
      <div className="h-full rounded-full bg-pass transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

const tones = {
  neutral: "border-line-strong text-ink-2",
  pass: "border-pass/50 bg-pass-soft text-pass",
  warn: "border-warn/50 bg-warn-soft text-warn",
  pen: "border-pen/40 bg-pen-soft text-pen",
  fail: "border-fail/50 bg-fail-soft text-fail",
} as const;

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: keyof typeof tones }) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", tones[tone])}>{label}</span>
  );
}

/** Shown when Arabic content is missing and the English version is displayed instead. */
export function FallbackNotice({ text }: { text: string }) {
  return (
    <p role="note" className="rounded-md border border-warn/50 bg-warn-soft px-4 py-3 text-sm text-warn">
      {text}
    </p>
  );
}
