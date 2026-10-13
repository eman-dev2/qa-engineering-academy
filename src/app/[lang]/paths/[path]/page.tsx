import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCertifications, getPath, getPaths, getProjects } from "@/lib/content/repo";
import type { PathView } from "@/lib/content/types";
import { getCurrentUser } from "@/lib/auth/dal";
import { getProgressMap } from "@/lib/progress";
import { format, formatMinutes, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { ButtonLink, Container, FallbackNotice, LevelRange, ProgressBar, StatusBadge } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

export const instant = false;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const paths = await getPaths(params.lang === "ar" ? "ar" : "en");
  return paths.map((p) => ({ path: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/paths/[path]">): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const slug = (await params).path;
  const p = await getPath(locale, slug);
  return p ? { title: p.title, description: p.summary, alternates: { languages: { en: `/paths/${slug}`, ar: `/ar/paths/${slug}` } } } : {};
}

export default async function PathPage({ params }: PageProps<"/[lang]/paths/[path]">) {
  const { locale, t } = await resolveLocale(params);
  const path = await getPath(locale, (await params).path);
  if (!path) notFound();
  const L = (p: string) => localePath(locale, p);
  const [projects, certs] = await Promise.all([getProjects(locale), getCertifications(locale)]);
  const relatedProjects = projects.filter((p) => p.relatedPaths.includes(path.slug));
  const relatedCerts = certs.filter((c) => c.relatedPaths.includes(path.slug));
  const total = path.lessons.length + path.plannedCount;
  const first = path.lessons[0];

  return (
    <Container>
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-3">
        <Link href={L("/paths")} className="hover:text-pen">
          {t.paths.breadcrumb}
        </Link>
      </nav>
      <header className="grid gap-10 border-b border-line pb-10 pt-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {path.fallback && (
            <div className="mb-5">
              <FallbackNotice text={t.common.notTranslated} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <LevelRange
              from={t.levels[path.startsAt]}
              to={t.levels[path.leadsTo]}
              label={format(t.levelRange, { from: t.levels[path.startsAt], to: t.levels[path.leadsTo] })}
              rtl={locale === "ar"}
            />
            {path.status === "planned" && <StatusBadge label={t.paths.inDevelopmentTitle} tone="warn" />}
          </div>
          <h1 className="mt-3 text-[2.3rem] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[3rem]">{path.title}</h1>
          <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-ink-2">{path.summary}</p>
          <div className="mt-6 rounded-lg border-s-4 border-highlighter bg-surface px-5 py-4">
            <p className="text-sm font-semibold text-ink-3">{t.paths.goal}</p>
            <p className="mt-1 leading-relaxed">{path.goal}</p>
          </div>
        </div>
        <div className="space-y-6 self-end">
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-ink-3">{t.paths.modules}</dt>
              <dd className="text-xl font-bold tabular-nums">{path.modules.length}</dd>
            </div>
            <div>
              <dt className="text-ink-3">{t.paths.lessons}</dt>
              <dd className="text-xl font-bold tabular-nums">
                {path.lessons.length}
                <span className="text-sm font-medium text-ink-3"> / {total}</span>
              </dd>
            </div>
            <div>
              <dt className="text-ink-3">{t.paths.effort}</dt>
              <dd className="text-xl font-bold">{formatMinutes(locale, path.totalMinutes)}</dd>
            </div>
          </dl>
          <p className="text-sm text-ink-3">
            {format(t.paths.publishedOf, { published: path.lessons.length, total })}. {t.paths.effortNote}
          </p>
          {first ? (
            <Suspense fallback={<ButtonLink href={L(`/paths/${path.slug}/${first.slug}`)}>{t.paths.start}</ButtonLink>}>
              <PathProgress path={path} locale={locale} t={t} />
            </Suspense>
          ) : (
            <p className="rounded-md border border-warn/50 bg-warn-soft px-4 py-3 text-sm text-warn">{t.paths.noPublishedYet}</p>
          )}
        </div>
      </header>

      <div className="grid gap-12 py-12 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="sequence">
          <h2 id="sequence" className="text-2xl font-bold tracking-[-0.01em]">
            {t.paths.sequence}
          </h2>
          <Suspense fallback={<Sequence path={path} completed={null} locale={locale} t={t} />}>
            <SequenceWithProgress path={path} locale={locale} t={t} />
          </Suspense>
        </section>

        <aside className="space-y-10">
          <section aria-labelledby="outcomes">
            <h2 id="outcomes" className="text-lg font-bold">
              {t.paths.outcomes}
            </h2>
            <ul className="mt-3 space-y-2.5 text-[0.97rem] leading-relaxed">
              {path.outcomes.map((o) => (
                <li key={o} className="flex gap-2.5">
                  <span aria-hidden className="mt-[0.7rem] h-1.5 w-3 shrink-0 bg-highlighter" />
                  {o}
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="prereq">
            <h2 id="prereq" className="text-lg font-bold">
              {t.paths.prerequisites}
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[0.97rem] text-ink-2">
              {path.prerequisites.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="milestones">
            <h2 id="milestones" className="text-lg font-bold">
              {t.paths.milestones}
            </h2>
            <ol className="mt-3 list-decimal space-y-1.5 ps-5 text-[0.97rem] text-ink-2">
              {path.milestones.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </section>
          {relatedProjects.length > 0 && (
            <section aria-labelledby="projects">
              <h2 id="projects" className="text-lg font-bold">
                {t.paths.relatedProjects}
              </h2>
              <ul className="mt-3 space-y-2">
                {relatedProjects.map((p) => (
                  <li key={p.slug}>
                    <Link href={L(`/library/projects/${p.slug}`)} className="font-medium text-pen underline underline-offset-2">
                      {p.title}
                    </Link>
                    <span className="text-sm text-ink-3"> · {format(t.library.hours, { hours: p.hours })}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {relatedCerts.length > 0 && (
            <section aria-labelledby="certs">
              <h2 id="certs" className="text-lg font-bold">
                {t.paths.relatedCerts}
              </h2>
              <ul className="mt-3 space-y-2">
                {relatedCerts.map((c) => (
                  <li key={c.slug}>
                    {c.verified ? (
                      <Link href={L(`/certifications/${c.slug}`)} className="font-medium text-pen underline underline-offset-2">
                        {c.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                    <span className="text-sm text-ink-3"> · {c.code}</span>
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

async function PathProgress({ path, locale, t }: { path: PathView; locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const user = await getCurrentUser();
  const first = path.lessons[0];
  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href={L(`/paths/${path.slug}/${first.slug}`)}>{t.paths.start}</ButtonLink>
        <Link href={`${L("/signup")}?next=${encodeURIComponent(L(`/paths/${path.slug}`))}`} className="text-sm font-medium text-pen underline underline-offset-2">
          {t.paths.createToTrack}
        </Link>
      </div>
    );
  }
  const map = getProgressMap(user.id);
  const done = path.lessons.filter((l) => map.get(l.key)?.status === "completed").length;
  const nextLesson = path.lessons.find((l) => map.get(l.key)?.status !== "completed");
  const text = format(t.paths.completedOf, { done, total: path.lessons.length });
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{text}</p>
      <ProgressBar value={done} max={path.lessons.length} label={format(t.dashboard.progressLabel, { title: path.title })} valueText={text} />
      {nextLesson ? (
        <ButtonLink href={L(`/paths/${path.slug}/${nextLesson.slug}`)}>
          {done === 0 ? t.paths.start : format(t.paths.continueWith, { n: nextLesson.position ?? 1 })}
        </ButtonLink>
      ) : (
        <p className="font-semibold text-pass">{t.paths.pathComplete}</p>
      )}
    </div>
  );
}

async function SequenceWithProgress({ path, locale, t }: { path: PathView; locale: Locale; t: Dictionary }) {
  const user = await getCurrentUser();
  if (!user) return <Sequence path={path} completed={null} locale={locale} t={t} />;
  const map = getProgressMap(user.id);
  return (
    <Sequence
      path={path}
      completed={new Set(path.lessons.filter((l) => map.get(l.key)?.status === "completed").map((l) => l.key))}
      locale={locale}
      t={t}
    />
  );
}

function Sequence({ path, completed, locale, t }: { path: PathView; completed: Set<string> | null; locale: Locale; t: Dictionary }) {
  return (
    <div className="mt-6 space-y-10">
      {path.modules.map((m, mi) => (
        <div key={m.slug}>
          <h3 className="text-lg font-bold">{format(t.paths.moduleN, { n: mi + 1, title: m.title })}</h3>
          <p className="mt-1 text-ink-2">{m.summary}</p>
          <ol className="mt-4 divide-y divide-line border-y border-line">
            {m.lessons.map((l) => {
              if (l.status !== "published") {
                return (
                  <li key={l.key} className="grid grid-cols-[2rem_1fr_auto] gap-3 py-4">
                    <span aria-hidden className="mt-0.5 h-6 w-6 rounded-full border border-dashed border-line-strong" />
                    <span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink-2">{l.title}</span>
                        <StatusBadge label={t.paths.plannedBadge} />
                      </span>
                      <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink-3">{l.summary}</span>
                      <span className="mt-1 block text-xs text-ink-3">{t.paths.plannedNote}</span>
                    </span>
                    <span className="whitespace-nowrap text-sm text-ink-3">{formatMinutes(locale, l.minutes)}</span>
                  </li>
                );
              }
              const done = completed?.has(l.key);
              return (
                <li key={l.key}>
                  <Link href={localePath(locale, `/paths/${path.slug}/${l.slug}`)} className="group grid grid-cols-[2rem_1fr_auto] gap-3 py-4">
                    <span
                      className={
                        done
                          ? "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-pass text-on-pen"
                          : "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-line-strong text-xs font-semibold tabular-nums text-ink-3"
                      }
                    >
                      {done ? <CheckIcon size={14} strokeWidth={3} /> : l.position}
                    </span>
                    <span>
                      <span className="font-semibold group-hover:text-pen">{l.title}</span>
                      {done && <span className="sr-only"> {t.paths.completedSr}</span>}
                      <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink-2">{l.summary}</span>
                    </span>
                    <span className="whitespace-nowrap text-sm text-ink-3">{formatMinutes(locale, l.minutes)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
