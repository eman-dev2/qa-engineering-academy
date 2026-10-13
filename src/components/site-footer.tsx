import Link from "next/link";
import { site } from "@/content/site";
import { format, localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { Container } from "./ui";
import { LogoMark } from "./logo";
import { LinkedInIcon } from "./icons";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const ownerName = locale === "ar" ? site.owner.nameAr : site.owner.name;
  const link = "text-ink-2 hover:text-pen";
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-ink">
            <LogoMark size={24} />
            <span className="font-bold">{t.meta.siteName}</span>
          </div>
          <p className="mt-3 max-w-[38ch] text-sm leading-relaxed text-ink-2">{t.meta.tagline}</p>
          <p className="mt-6 text-sm text-ink-2">
            {t.footer.createdBy}{" "}
            <Link href={L("/about")} className="font-semibold text-ink underline underline-offset-2 hover:text-pen">
              {ownerName}
            </Link>
          </p>
          <a
            href={site.owner.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:border-pen hover:text-pen"
          >
            <LinkedInIcon size={16} />
            {format(t.footer.onLinkedIn, { name: ownerName })}
            <span className="sr-only">{t.common.opensInNewTab}</span>
          </a>
        </div>
        <nav aria-label={t.footer.learn}>
          <h2 className="text-sm font-semibold text-ink">{t.footer.learn}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} href={L("/paths")}>{t.footer.pathsLink}</Link></li>
            <li><Link className={link} href={L("/certifications")}>{t.footer.certsLink}</Link></li>
            <li><Link className={link} href={L("/library")}>{t.footer.libraryLink}</Link></li>
            <li><Link className={link} href={L("/search")}>{t.footer.searchLink}</Link></li>
            <li><Link className={link} href={L("/dashboard")}>{t.footer.dashboardLink}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t.footer.project}>
          <h2 className="text-sm font-semibold text-ink">{t.footer.project}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className={link} href={L("/about")}>{t.footer.aboutLink}</Link></li>
            <li><Link className={link} href={L("/roadmap")}>{t.footer.roadmapLink}</Link></li>
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-line py-5 text-xs text-ink-3">
        <p>{t.footer.disclaimer}</p>
      </Container>
    </footer>
  );
}
