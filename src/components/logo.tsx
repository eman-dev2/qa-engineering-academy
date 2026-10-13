import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localePath } from "@/i18n/config";

/**
 * The mark is a closed interval [ ● ● ]: the two boundary values every tester checks first.
 */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable={false}>
      <path d="M10 5H5v22h5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <path d="M22 5h5v22h-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <circle cx="12.5" cy="16" r="2.6" fill="var(--highlighter)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="19.5" cy="16" r="2.6" fill="var(--highlighter)" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function Logo({ locale, siteName, homeLabel }: { locale: Locale; siteName: string; homeLabel: string }) {
  const [line1, line2] = locale === "ar" ? ["أكاديمية", "هندسة الجودة"] : ["QA Engineering", "Academy"];
  return (
    <Link href={localePath(locale, "/")} className="group inline-flex items-center gap-2.5 text-ink no-underline" aria-label={`${siteName}, ${homeLabel}`}>
      <LogoMark />
      <span className="whitespace-nowrap leading-none">
        <span className="block text-[1.02rem] font-bold tracking-[-0.01em]">{line1}</span>
        <span className="mt-1 block text-[0.78rem] font-medium tracking-[0.02em] text-ink-2">{line2}</span>
      </span>
    </Link>
  );
}
