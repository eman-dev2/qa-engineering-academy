"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Disclosure menu for signed-in users (native <details>, so it works before hydration).
 * Closes on Escape, on a click outside, and when a link or button inside is used.
 */
export function AccountMenu({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = () => ref.current?.removeAttribute("open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);
  return (
    <details ref={ref} className="group relative">
      <summary className="flex min-h-11 max-w-[11rem] cursor-pointer list-none items-center gap-1.5 rounded-md px-3 font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="truncate">{label}</span>
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 transition-transform group-open:rotate-180">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div
        className="absolute end-0 z-50 mt-2 flex w-56 flex-col gap-1 rounded-lg border border-line bg-surface p-2 shadow-[0_12px_32px_-12px_rgba(22,26,44,0.35)]"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a, button")) ref.current?.removeAttribute("open");
        }}
      >
        {children}
      </div>
    </details>
  );
}
