"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cx } from "@/components/ui";

type Item = { href: string; label: string; exact?: boolean };

function NavList({ items, label, pathname }: { items: Item[]; label: string; pathname: string | null }) {
  return (
    <nav aria-label={label} className="overflow-x-auto">
      <ul className="flex gap-1 whitespace-nowrap border-b border-line">
        {items.map((i) => {
          const active = pathname !== null && (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`));
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "-mb-px inline-block border-b-2 px-3 py-2.5 text-sm font-medium",
                  active ? "border-pen text-ink" : "border-transparent text-ink-2 hover:border-line-strong hover:text-ink",
                )}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ActiveNav(props: { items: Item[]; label: string }) {
  return <NavList {...props} pathname={usePathname() || ""} />;
}

/** Admin section tabs. The active tab needs the URL, which streams in after the static shell. */
export function AdminNav(props: { items: Item[]; label: string }) {
  return (
    <Suspense fallback={<NavList {...props} pathname={null} />}>
      <ActiveNav {...props} />
    </Suspense>
  );
}
