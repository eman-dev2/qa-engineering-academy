"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { localePath, stripLocale, type Locale } from "@/i18n/config";

function SwitchLink({ target, text, label }: { target: Locale; text: string; label: string }) {
  const { path } = stripLocale(usePathname() || "/");
  const query = useSearchParams()?.toString();
  const href = localePath(target, path) + (query ? `?${query}` : "");
  return (
    <Link
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={label}
      title={label}
      className="inline-flex h-10 items-center justify-center rounded-md px-2.5 text-[0.95rem] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      {text}
    </Link>
  );
}

/** Link to the same page in the other language. */
export function LanguageSwitch({ current, text, label }: { current: Locale; text: string; label: string }) {
  const target: Locale = current === "ar" ? "en" : "ar";
  return (
    <Suspense
      fallback={
        <Link href={localePath(target, "/")} hrefLang={target} lang={target} aria-label={label} className="inline-flex h-10 items-center px-2.5 text-[0.95rem] font-semibold text-ink-2">
          {text}
        </Link>
      }
    >
      <SwitchLink target={target} text={text} label={label} />
    </Suspense>
  );
}
