import type { Metadata } from "next";
import Link from "next/link";
import { getCertification, getPaths } from "@/lib/content/repo";
import { site } from "@/content/site";
import { format, formatIsoDate, formatMinutes, localePath, plural } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { BoundaryProbe } from "@/components/boundary-probe";
import { ButtonLink, Container, ExternalLink, LevelRange, StatusBadge, TextLink } from "@/components/ui";
import { LinkedInIcon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  await resolveLocale(params);
  return { alternates: { languages: { en: "/", ar: "/ar" } } };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { locale, t } = await resolveLocale(params);
  const L = (p: string) => localePath(locale, p);
  const [paths, ctfl] = await Promise.all([getPaths(locale), getCertification(locale, "ctfl")]);
  const published = paths.filter((p) => p.status === "published" && p.lessons.length > 0);
  const lessonCount = paths.reduce((n, p) => n + p.lessons.length, 0);
  const first = published[0];
  const firstLesson = first?.lessons[0];
  const sample = first?.lessons[2] ?? firstLesson;
  const ownerName = locale === "ar" ? site.owner.nameAr : site.owner.name;
  const lessonsLabel = (n: number) => format(plural(locale, n, t.common.lessons), { count: n });

  return (
    <>
      <Container className="grid items-start gap-10 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20">
        <div className="lg:pt-6">
          <h1 className="text-[2.6rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[3.6rem] lg:text-[4.1rem]">
            {t.home.title1}
            <br />
            {t.home.title2}
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink-2">{t.home.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {first && firstLesson && <ButtonLink href={L(`/paths/${first.slug}/${firstLesson.slug}`)}>{t.home.startFirst}</ButtonLink>}
            <ButtonLink href={L("/paths")} variant="secondary">
              {t.home.browsePaths}
            </ButtonLink>
          </div>
          <p className="mt-6 text-sm text-ink-3">{t.home.freeNote}</p>
        </div>
        <BoundaryProbe t={t.probe} />
      </Container>

      <section aria-labelledby="paths-heading" className="border-y border-line bg-surface">
        <Container className="py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="paths-heading" className="text-3xl font-bold tracking-[-0.02em]">
                {t.home.pathsTitle}
              </h2>
              <p className="mt-2 max-w-[60ch] text-ink-2">{format(t.home.pathsLead, { lessons: lessonCount })}</p>
            </div>
            <TextLink href={L("/paths")} className="font-semibold">
              {t.home.allPaths}
            </TextLink>
          </div>

          <ol className="mt-10 divide-y divide-line border-y border-line">
            {paths.map((p, i) => {
              const total = p.lessons.length + p.plannedCount;
              return (
                <li key={p.slug} className="grid gap-4 py-8 md:grid-cols-[3rem_1.2fr_1fr] md:gap-8">
                  <span className="text-2xl font-bold tabular-nums text-ink-3" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-[-0.01em]">
                      <Link href={L(`/paths/${p.slug}`)} className="hover:text-pen">
                        {p.title}
                      </Link>
                      {p.status === "planned" && <StatusBadge label={t.home.inDevelopment} tone="warn" />}
                    </h3>
                    <p className="mt-2 max-w-[52ch] leading-relaxed text-ink-2">{p.summary}</p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
                      <LevelRange
                        from={t.levels[p.startsAt]}
                        to={t.levels[p.leadsTo]}
                        label={format(t.levelRange, { from: t.levels[p.startsAt], to: t.levels[p.leadsTo] })}
                        rtl={locale === "ar"}
                      />
                      <span>{format(t.home.publishedOf, { published: p.lessons.length, total })}</span>
                      {p.totalMinutes > 0 && <span>{formatMinutes(locale, p.totalMinutes)}</span>}
                    </p>
                  </div>
                  <ul className="space-y-2 self-center text-[0.95rem]">
                    {p.modules.map((m) => (
                      <li key={m.slug} className="border-s-2 border-line-strong ps-3">
                        <span className="font-medium text-ink">{m.title}</span>
                        <span className="block text-sm text-ink-3">{lessonsLabel(m.lessons.length)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </Container>
      </section>

      <Container className="grid gap-10 py-20 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="text-3xl font-bold tracking-[-0.02em]">{t.home.anatomyTitle}</h2>
          <p className="mt-3 max-w-[46ch] leading-relaxed text-ink-2">{t.home.anatomyLead}</p>
          {first && sample && (
            <p className="mt-6">
              <TextLink href={L(`/paths/${first.slug}/${sample.slug}`)} className="font-semibold">
                {format(t.home.sampleLesson, { title: sample.title })}
              </TextLink>
            </p>
          )}
        </div>
        <ol className="relative border-s-2 border-line-strong">
          {t.home.anatomy.map((part, i) => (
            <li key={part.name} className="relative pb-6 ps-8 last:pb-0">
              <span
                aria-hidden
                className="absolute -start-[0.8rem] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-line-strong bg-paper text-xs font-bold text-ink-2"
              >
                {i + 1}
              </span>
              <h3 className="font-semibold leading-6 text-ink">{part.name}</h3>
              <p className="mt-1 text-[0.95rem] text-ink-2">{part.detail}</p>
            </li>
          ))}
        </ol>
      </Container>

      {ctfl?.exam && (
        <section aria-labelledby="cert-heading" className="border-y border-line bg-surface">
          <Container className="grid gap-10 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div>
              <h2 id="cert-heading" className="text-3xl font-bold tracking-[-0.02em]">
                {t.home.certTitle}
              </h2>
              <p className="mt-3 max-w-[48ch] leading-relaxed text-ink-2">{t.home.certLead}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href={L("/certifications")} variant="secondary">
                  {t.home.openHub}
                </ButtonLink>
                <ButtonLink href={`${L("/certifications/ctfl")}#practice`} variant="quiet">
                  {t.home.tryPractice}
                </ButtonLink>
              </div>
            </div>
            <div className="rounded-lg border border-line">
              <div className="border-b border-line px-5 py-4">
                <p className="font-semibold" lang="en">
                  {ctfl.name} ({ctfl.code})
                </p>
                <p className="text-sm text-ink-2">{ctfl.version}</p>
              </div>
              <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                {[
                  [t.home.factQuestions, String(ctfl.exam.questions ?? "–")],
                  [t.home.factPassMark, format(t.home.passMarkValue, { score: ctfl.exam.passingScore ?? "–", total: ctfl.exam.totalPoints ?? "–" })],
                  [t.home.factDuration, format(t.home.durationValue, { minutes: ctfl.exam.durationMinutes ?? "–" })],
                  [t.home.factPrereq, t.home.none],
                ].map(([k, v]) => (
                  <div key={k} className="bg-surface px-5 py-4">
                    <dt className="text-sm text-ink-3">{k}</dt>
                    <dd className="mt-1 text-xl font-bold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="border-t border-line px-5 py-3 text-sm text-ink-2">
                {t.home.source}:{" "}
                <ExternalLink href={ctfl.sourceUrl} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
                  istqb.org
                </ExternalLink>
                {locale === "ar" ? "، " : ", "}
                {ctfl.reviewedOn && format(t.home.reviewedOn, { date: formatIsoDate(locale, ctfl.reviewedOn) })}
              </p>
            </div>
          </Container>
        </section>
      )}

      <Container className="grid gap-10 py-20 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.01em]">{t.home.libraryTitle}</h2>
          <p className="mt-3 max-w-[46ch] leading-relaxed text-ink-2">{t.home.libraryLead}</p>
          <p className="mt-5">
            <TextLink href={L("/library")} className="font-semibold">
              {t.home.openLibrary}
            </TextLink>
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-[-0.01em]">{t.home.ownerTitle}</h2>
          <p className="mt-3 leading-relaxed text-ink-2">{format(t.home.ownerText, { site: t.meta.siteName, name: ownerName })}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <TextLink href={L("/about")} className="font-semibold">
              {t.home.aboutProject}
            </TextLink>
            <a href={site.owner.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-pen">
              <LinkedInIcon size={16} />
              {t.home.connectLinkedIn}
              <span className="sr-only">{t.common.opensInNewTab}</span>
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
