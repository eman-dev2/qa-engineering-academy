import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCertification, getCertifications, getPaths, publicQuestions } from "@/lib/content/repo";
import { format, formatIsoDate, localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { Container, ExternalLink, FallbackNotice } from "@/components/ui";
import { QuizForm } from "@/components/lesson/quiz-form";

export const instant = false;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const certs = await getCertifications(params.lang === "ar" ? "ar" : "en");
  return certs.filter((c) => c.verified).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/certifications/[slug]">): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const slug = (await params).slug;
  const c = await getCertification(locale, slug);
  if (!c || !c.verified) return {};
  return {
    title: `${c.name} (${c.code})`,
    description: c.summary ?? undefined,
    alternates: { languages: { en: `/certifications/${slug}`, ar: `/ar/certifications/${slug}` } },
  };
}

const h2 = "text-2xl font-bold tracking-[-0.01em]";

export default async function CertificationPage({ params }: PageProps<"/[lang]/certifications/[slug]">) {
  const { locale, t } = await resolveLocale(params);
  const cert = await getCertification(locale, (await params).slug);
  if (!cert || !cert.verified) notFound();
  const L = (p: string) => localePath(locale, p);
  const paths = await getPaths(locale);
  const related = cert.relatedPaths.map((s) => paths.find((p) => p.slug === s)).filter((p) => p !== undefined);
  const exam = cert.exam;
  const ns = t.certs.notStated;
  const facts: [string, string][] = exam
    ? [
        [t.certs.questions, exam.questions?.toString() ?? ns],
        [t.certs.totalPoints, exam.totalPoints?.toString() ?? ns],
        [
          t.certs.passMark,
          exam.passingScore !== null && exam.totalPoints
            ? format(t.certs.passMarkValue, { score: exam.passingScore, pct: Math.round((exam.passingScore / exam.totalPoints) * 100) })
            : ns,
        ],
        [t.certs.duration, exam.durationMinutes ? format(t.certs.durationValue, { minutes: exam.durationMinutes }) : ns],
        [t.certs.nonNative, exam.nonNativeExtension ? format(t.certs.nonNativeValue, { value: exam.nonNativeExtension }) : t.certs.notStatedOfficial],
      ]
    : [];
  const chapters = cert.chaptersTranslated ?? cert.chapters;
  const linkLabel = (label: string) => t.certs.linkLabels[label] ?? label;
  const selfHref = L(`/certifications/${cert.slug}`);
  const sourceNote = t.certs.sourceNote.split(/(\{link\}|\{date\})/);

  return (
    <Container>
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-3">
        <Link href={L("/certifications")} className="hover:text-pen">
          {t.certs.breadcrumb}
        </Link>
      </nav>
      <header className="border-b border-line pb-8 pt-5">
        {cert.fallback && (
          <div className="mb-5">
            <FallbackNotice text={t.common.notTranslated} />
          </div>
        )}
        <p className="ltr inline-block font-mono text-sm font-semibold text-ink-2">
          {cert.issuer} {cert.code}
        </p>
        <h1 className="mt-2 max-w-[26ch] text-[2.1rem] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[2.7rem]" lang="en">
          {cert.name}
        </h1>
        <p className="mt-2 text-ink-2">
          {t.certs.streams[cert.stream] ?? cert.stream}
          {cert.version && <>{locale === "ar" ? "، " : ", "}{cert.version}</>}
        </p>
        {cert.summary && <p className="mt-5 max-w-[64ch] text-lg leading-relaxed text-ink-2">{cert.summary}</p>}
      </header>

      <div className="grid gap-12 py-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-12">
          <section aria-labelledby="exam">
            <h2 id="exam" className={h2}>
              {t.certs.examFormat}
            </h2>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {facts.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(8rem,11rem)_1fr] gap-4 py-3">
                  <dt className="text-ink-2">{k}</dt>
                  <dd className="font-semibold">{v}</dd>
                </div>
              ))}
              <div className="grid grid-cols-[minmax(8rem,11rem)_1fr] gap-4 py-3">
                <dt className="text-ink-2">{t.certs.fees}</dt>
                <dd>{t.certs.feesValue}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-ink-3">
              {sourceNote.map((part, i) =>
                part === "{link}" ? (
                  <ExternalLink key={i} href={cert.sourceUrl} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
                    {t.certs.officialCertPage}
                  </ExternalLink>
                ) : part === "{date}" ? (
                  <span key={i}>{cert.reviewedOn ? formatIsoDate(locale, cert.reviewedOn) : ""}</span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </p>
          </section>

          {chapters.length > 0 && (
            <section aria-labelledby="syllabus">
              <h2 id="syllabus" className={h2}>
                {t.certs.syllabus}
              </h2>
              <ol className="mt-4 list-decimal space-y-2 ps-6 text-[1.02rem] marker:font-semibold marker:text-ink-3">
                {chapters.map((c, i) => (
                  <li key={c} className="ps-1">
                    {c}
                    {cert.chaptersTranslated && cert.chapters[i] && (
                      <span className="block text-sm text-ink-3" lang="en" dir="ltr">
                        {cert.chapters[i]}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-ink-3">{t.certs.syllabusNote}</p>
            </section>
          )}

          {cert.studyPlan.length > 0 && (
            <section aria-labelledby="plan">
              <h2 id="plan" className={h2}>
                {t.certs.studyPlan}
              </h2>
              <ol className="mt-5 space-y-6 border-s-2 border-line-strong">
                {cert.studyPlan.map((w) => (
                  <li key={w.week} className="relative ps-6">
                    <span aria-hidden className="absolute -start-[0.45rem] top-1.5 h-3 w-3 rounded-full border-2 border-line-strong bg-paper" />
                    <h3 className="font-bold">
                      {w.week}: {w.focus}
                    </h3>
                    <ul className="mt-2 list-disc space-y-1.5 ps-5 text-[0.97rem] leading-relaxed text-ink-2">
                      {w.activities.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {cert.practice.length > 0 && (
            <section aria-labelledby="practice-title" id="practice" className="scroll-mt-24">
              <h2 className={h2} id="practice-title">
                {t.certs.practice}
              </h2>
              <p className="mt-2 max-w-[62ch] text-ink-2">{format(t.certs.practiceLead, { count: cert.practice.length })}</p>
              <div className="mt-6">
                <QuizForm
                  subject={`cert:${cert.slug}`}
                  questions={publicQuestions(cert.practice)}
                  locale={locale}
                  t={t.quiz}
                  loginHref={`${L("/login")}?next=${encodeURIComponent(selfHref)}`}
                  dashboardHref={L("/dashboard")}
                />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-8">
          {cert.audience.length > 0 && (
            <section aria-labelledby="audience">
              <h2 id="audience" className="text-lg font-bold">
                {t.certs.audience}
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[0.95rem] text-ink-2">
                {cert.audience.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          )}
          {cert.prerequisites.length > 0 && (
            <section aria-labelledby="prereq">
              <h2 id="prereq" className="text-lg font-bold">
                {t.certs.prerequisites}
              </h2>
              <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[0.95rem] text-ink-2">
                {cert.prerequisites.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </section>
          )}
          {cert.officialLinks.length > 0 && (
            <section aria-labelledby="links">
              <h2 id="links" className="text-lg font-bold">
                {t.certs.officialResources}
              </h2>
              <ul className="mt-3 space-y-2 text-[0.95rem]">
                {cert.officialLinks.map((l) => (
                  <li key={l.url}>
                    <ExternalLink href={l.url} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
                      {linkLabel(l.label)}
                    </ExternalLink>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="text-lg font-bold">
                {t.certs.relatedPaths}
              </h2>
              <ul className="mt-3 space-y-2">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link href={L(`/paths/${p.slug}`)} className="font-semibold text-pen underline underline-offset-2">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </Container>
  );
}
