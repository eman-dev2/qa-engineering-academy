import type { Metadata } from "next";
import { site } from "@/content/site";
import { getCertifications, getPaths } from "@/lib/content/repo";
import { format } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { Container, PageHeading } from "@/components/ui";
import { LinkedInIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.about.title, description: t.about.metaDescription, alternates: { languages: { en: "/about", ar: "/ar/about" } } };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { locale, t } = await resolveLocale(params);
  const [paths, certs] = await Promise.all([getPaths(locale), getCertifications(locale)]);
  const lessons = paths.reduce((n, p) => n + p.lessons.length, 0);
  const verified = certs.filter((c) => c.verified).length;
  const ownerName = locale === "ar" ? site.owner.nameAr : site.owner.name;

  return (
    <Container>
      <PageHeading title={t.about.title} lead={t.about.lead} />

      <div className="grid gap-14 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="max-w-[64ch] space-y-10">
          <section aria-labelledby="why">
            <h2 id="why" className="text-2xl font-bold tracking-[-0.01em]">
              {t.about.whyTitle}
            </h2>
            <div className="mt-4 space-y-4 font-serif text-[1.05rem] leading-[1.8]">
              <p>{t.about.why1}</p>
              <p>{t.about.why2}</p>
            </div>
          </section>

          <section aria-labelledby="principles">
            <h2 id="principles" className="text-2xl font-bold tracking-[-0.01em]">
              {t.about.howTitle}
            </h2>
            <ul className="mt-4 space-y-3 text-[1rem] leading-relaxed text-ink-2">
              {t.about.how.map((h) => (
                <li key={h.k}>
                  <strong className="text-ink">{h.k}</strong> {h.v}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="status">
            <h2 id="status" className="text-2xl font-bold tracking-[-0.01em]">
              {t.about.statusTitle}
            </h2>
            <ul className="mt-4 list-disc space-y-1.5 ps-5 text-ink-2">
              {t.about.status.map((s) => (
                <li key={s}>{format(s, { paths: paths.length, lessons, verified })}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-2xl font-bold tracking-[-0.01em]">
              {t.about.contactTitle}
            </h2>
            <p className="mt-4 leading-relaxed text-ink-2">{format(t.about.contact, { name: ownerName })}</p>
          </section>
        </div>

        <aside aria-labelledby="owner" className="self-start rounded-lg border border-line bg-surface p-6 lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pen-soft text-pen">
              <LogoMark size={30} />
            </span>
            <div>
              <h2 id="owner" className="text-lg font-bold">
                {ownerName}
              </h2>
              <p className="text-sm text-ink-2">{t.about.ownerRole}</p>
            </div>
          </div>
          <p className="mt-5 text-[0.97rem] leading-relaxed text-ink-2">{format(t.about.ownerText, { name: ownerName })}</p>
          <a
            href={site.owner.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-pen px-4 py-3 font-semibold text-on-pen hover:bg-pen-hover"
          >
            <LinkedInIcon size={18} />
            {t.about.viewLinkedIn}
            <span className="sr-only">{t.common.opensInNewTab}</span>
          </a>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">{t.about.linkedInNote}</p>
        </aside>
      </div>
    </Container>
  );
}
