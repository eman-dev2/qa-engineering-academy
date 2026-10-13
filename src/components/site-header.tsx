import Link from "next/link";
import { Suspense } from "react";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Container } from "./ui";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitch } from "./language-switch";
import { SearchIcon } from "./icons";

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const nav = [
    { href: L("/paths"), label: t.nav.paths },
    { href: L("/certifications"), label: t.nav.certifications },
    { href: L("/library"), label: t.nav.library },
    { href: L("/roadmap"), label: t.nav.roadmap },
    { href: L("/about"), label: t.nav.about },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-sm supports-[backdrop-filter]:bg-paper/85">
      <Container className="flex h-16 items-center gap-3">
        <div className="shrink-0">
          <Logo locale={locale} siteName={t.meta.siteName} homeLabel={t.common.home} />
        </div>
        <nav aria-label={t.nav.main} className="ms-4 hidden xl:block">
          <ul className="flex items-center gap-0.5">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="whitespace-nowrap rounded-md px-2.5 py-2 text-[0.95rem] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-0.5">
          <Link
            href={L("/search")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink"
            aria-label={t.common.searchLabel}
          >
            <SearchIcon />
          </Link>
          <LanguageSwitch current={locale} text={t.common.switchToOther} label={t.common.switchToOtherLabel} />
          <ThemeToggle toDark={t.common.themeToDark} toLight={t.common.themeToLight} />
          <div className="hidden sm:block">
            <Suspense fallback={<div className="h-11 w-[9.5rem]" aria-hidden />}>
              <UserMenu locale={locale} t={t} />
            </Suspense>
          </div>
          <MobileNav
            items={[...nav, { href: L("/search"), label: t.common.search }]}
            labels={{ open: t.common.openMenu, close: t.common.closeMenu, nav: t.nav.mobile }}
          >
            <Suspense fallback={null}>
              <UserMenu locale={locale} t={t} compact />
            </Suspense>
          </MobileNav>
        </div>
      </Container>
    </header>
  );
}
