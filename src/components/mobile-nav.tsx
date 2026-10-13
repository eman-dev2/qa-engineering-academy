"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MenuIcon, CrossIcon } from "./icons";

export function MobileNav({
  items,
  labels,
  children,
}: {
  items: { href: string; label: string }[];
  labels: { open: string; close: string; nav: string };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface-2"
      >
        {open ? <CrossIcon /> : <MenuIcon />}
        <span className="sr-only">{open ? labels.close : labels.open}</span>
      </button>
      <div
        id="mobile-menu"
        hidden={!open}
        // Close the menu when a link inside it is followed. (Reading the pathname here would make
        // every page with dynamic segments wait for runtime data before its shell can render.)
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-surface px-4 pb-6 pt-2 shadow-[0_12px_24px_-16px_rgba(22,26,44,0.35)]"
      >
        <nav aria-label={labels.nav}>
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="block py-3 text-lg font-medium text-ink">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 sm:hidden">{children}</div>
      </div>
    </div>
  );
}
