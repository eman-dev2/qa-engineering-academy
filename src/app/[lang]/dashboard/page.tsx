import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { getAttempts, getBookmarks, getProgressMap } from "@/lib/progress";
import { getCertifications, getPaths } from "@/lib/content/repo";
import { skillIds } from "@/content/skills";
import { format, formatDateValue, formatMinutes, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { ButtonLink, Container, ProgressBar, TextLink, cx } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.dashboard, robots: { index: false } };
}

export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Container className="py-10 sm:py-14">
      <Suspense fallback={<DashboardSkeleton label={t.dashboard.loadingLabel} />}>
        <Dashboard locale={locale} t={t} />
      </Suspense>
    </Container>
  );
}

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="animate-pulse space-y-6">
      <div className="h-10 w-72 rounded bg-surface-2" />
      <div className="h-32 rounded-lg bg-surface-2" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-lg bg-surface-2" />
        <div className="h-48 rounded-lg bg-surface-2" />
      </div>
    </div>
  );
}

async function Dashboard({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const user = await requireUser(L("/dashboard"));
  const [paths, certs] = await Promise.all([getPaths(locale), getCertifications(locale)]);
  const progress = getProgressMap(user.id);
  const attempts = getAttempts(user.id, 12);
  const allLessons = paths.flatMap((p) => p.lessons);
  const lessonByKey = new Map(allLessons.map((l) => [l.key, l]));
  const pathOf = (slug: string) => paths.find((p) => p.slug === slug);
  const bookmarks = getBookmarks(user.id)
    .map((b) => lessonByKey.get(b.lessonKey))
    .filter((l) => l !== undefined);
  const completedCount = allLessons.filter((l) => progress.get(l.key)?.status === "completed").length;
  const activePaths = paths.filter((p) => p.lessons.length > 0);

  // Continue: most recently touched unfinished lesson, else the first unfinished lesson overall.
  const inProgress = [...progress.entries()]
    .filter(([, v]) => v.status === "started")
    .sort((a, b) => b[1].updatedAt.getTime() - a[1].updatedAt.getTime())
    .map(([k]) => lessonByKey.get(k))
    .find((l) => l !== undefined);
  const nextUp = inProgress ?? allLessons.find((l) => progress.get(l.key)?.status !== "completed");

  const skillRows = skillIds.map((id) => {
    const lessons = allLessons.filter((l) => l.skills.includes(id));
    const done = lessons.filter((l) => progress.get(l.key)?.status === "completed").length;
    return { id, name: t.skills[id], total: lessons.length, done };
  });
  const withLessons = skillRows.filter((s) => s.total > 0);
  const withoutLessons = skillRows.filter((s) => s.total === 0);
  const sep = locale === "ar" ? "، " : ", ";

  function subjectInfo(subjectKey: string) {
    const [kind, ...rest] = subjectKey.split(":");
    const id = rest.join(":");
    if (kind === "lesson") {
      const l = lessonByKey.get(id);
      return l ? { title: l.title, href: `${L(`/paths/${l.pathSlug}/${l.slug}`)}#knowledge-check` } : null;
    }
    if (kind === "cert") {
      const c = certs.find((x) => x.slug === id);
      return c ? { title: format(t.dashboard.practiceSet, { code: c.code }), href: `${L(`/certifications/${c.slug}`)}#practice` } : null;
    }
    return null;
  }

  const statusText = (st: string | undefined) => (st === "completed" ? t.dashboard.completed : st === "started" ? t.dashboard.inProgress : t.dashboard.notStarted);
  const roadmapParts = t.dashboard.allDoneLead.split("{roadmap}");
  const historyParts = t.dashboard.historyEmpty.split("{link}");
  const savedParts = t.dashboard.savedEmpty.split("{button}");

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <p className="text-ink-2">
            {format(t.dashboard.signedInAs, { email: "" })}
            <span className="ltr">{user.email}</span>
          </p>
          <h1 className="mt-1 text-[2.2rem] font-bold leading-tight tracking-[-0.02em]">{format(t.dashboard.title, { name: user.name })}</h1>
        </div>
        <p className="text-ink-2">{format(t.dashboard.completedSummary, { done: completedCount, total: allLessons.length })}</p>
      </header>

      <section aria-labelledby="continue" className="mt-8 rounded-lg border border-line-strong bg-surface p-6">
        {nextUp ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 id="continue" className="text-sm font-medium text-ink-3">
                {inProgress ? t.dashboard.continueTitle : completedCount === 0 ? t.dashboard.startHere : t.dashboard.upNext}
              </h2>
              <p className="mt-1 text-xl font-bold">{nextUp.title}</p>
              <p className="text-sm text-ink-2">
                {format(t.dashboard.lessonOf, { n: nextUp.position ?? 1, path: pathOf(nextUp.pathSlug)?.title ?? "", minutes: formatMinutes(locale, nextUp.minutes) })}
              </p>
            </div>
            <ButtonLink href={L(`/paths/${nextUp.pathSlug}/${nextUp.slug}`)}>{inProgress ? t.dashboard.continueLesson : t.dashboard.openLesson}</ButtonLink>
          </div>
        ) : (
          <div>
            <h2 id="continue" className="text-xl font-bold">
              {t.dashboard.allDone}
            </h2>
            <p className="mt-1 text-ink-2">
              {roadmapParts[0]}
              <TextLink href={L("/roadmap")}>{t.dashboard.roadmap}</TextLink>
              {roadmapParts[1]}
            </p>
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="paths-progress">
          <h2 id="paths-progress" className="text-xl font-bold">
            {t.dashboard.paths}
          </h2>
          <ul className="mt-4 space-y-4">
            {activePaths.map((p) => {
              const done = p.lessons.filter((l) => progress.get(l.key)?.status === "completed").length;
              const valueText = format(t.paths.completedOf, { done, total: p.lessons.length });
              return (
                <li key={p.slug} className="rounded-lg border border-line bg-surface p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={L(`/paths/${p.slug}`)} className="font-semibold hover:text-pen">
                      {p.title}
                    </Link>
                    <span className="ltr text-sm tabular-nums text-ink-2">
                      {done}/{p.lessons.length}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={done} max={p.lessons.length} label={format(t.dashboard.progressLabel, { title: p.title })} valueText={valueText} />
                  </div>
                  <ul className="mt-4 grid gap-1.5 text-sm">
                    {p.lessons.map((l) => {
                      const st = progress.get(l.key)?.status;
                      return (
                        <li key={l.key} className="flex items-center gap-2">
                          <span
                            aria-hidden
                            className={cx(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                              st === "completed" ? "border-pass bg-pass text-on-pen" : st === "started" ? "border-pen" : "border-line-strong",
                            )}
                          >
                            {st === "completed" && <CheckIcon size={10} strokeWidth={3} />}
                          </span>
                          <Link href={L(`/paths/${p.slug}/${l.slug}`)} className="text-ink-2 hover:text-pen">
                            {l.title}
                          </Link>
                          <span className="sr-only">({statusText(st)})</span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="skills">
          <h2 id="skills" className="text-xl font-bold">
            {t.dashboard.skillMap}
          </h2>
          <p className="mt-1 text-sm text-ink-2">{t.dashboard.skillMapLead}</p>
          <ul className="mt-4 space-y-3">
            {withLessons.map((s) => (
              <li key={s.id}>
                <div className="flex items-baseline justify-between gap-3 text-[0.95rem]">
                  <span className="font-medium">{s.name}</span>
                  <span className="ltr text-sm tabular-nums text-ink-2">
                    {s.done}/{s.total}
                  </span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={s.done} max={s.total} label={format(t.dashboard.skillProgressLabel, { skill: s.name })} valueText={`${s.done} / ${s.total}`} />
                </div>
              </li>
            ))}
          </ul>
          {withoutLessons.length > 0 && (
            <p className="mt-5 text-sm leading-relaxed text-ink-3">{format(t.dashboard.noSkillLessons, { skills: withoutLessons.map((s) => s.name).join(sep) })}</p>
          )}
        </section>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section aria-labelledby="attempts">
          <h2 id="attempts" className="text-xl font-bold">
            {t.dashboard.history}
          </h2>
          {attempts.length === 0 ? (
            <p className="mt-3 text-ink-2">
              {historyParts[0]}
              <TextLink href={`${L("/certifications/ctfl")}#practice`}>{t.dashboard.ctflPractice}</TextLink>
              {historyParts[1]}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead>
                  <tr className="border-b-2 border-line-strong text-ink-3">
                    <th scope="col" className="py-2 pe-3 text-start font-medium">
                      {t.dashboard.colSet}
                    </th>
                    <th scope="col" className="py-2 pe-3 text-start font-medium">
                      {t.dashboard.colScore}
                    </th>
                    <th scope="col" className="py-2 text-start font-medium">
                      {t.dashboard.colDate}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => {
                    const info = subjectInfo(a.subjectKey);
                    return (
                      <tr key={a.id} className="border-b border-line">
                        <td className="py-2.5 pe-3">
                          {info ? (
                            <Link href={info.href} className="hover:text-pen">
                              {info.title}
                            </Link>
                          ) : (
                            <span className="text-ink-3">{t.dashboard.removed}</span>
                          )}
                        </td>
                        <td className={cx("ltr py-2.5 pe-3 font-semibold tabular-nums", a.score === a.total && "text-pass")}>
                          {a.score}/{a.total}
                        </td>
                        <td className="py-2.5 text-ink-2">{formatDateValue(locale, a.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-labelledby="saved">
          <h2 id="saved" className="text-xl font-bold">
            {t.dashboard.saved}
          </h2>
          {bookmarks.length === 0 ? (
            <p className="mt-3 text-ink-2">
              {savedParts[0]}
              <strong className="font-semibold">{t.lesson.saveForLater}</strong>
              {savedParts[1]}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {bookmarks.map((l) => (
                <li key={l.key} className="py-3">
                  <Link href={L(`/paths/${l.pathSlug}/${l.slug}`)} className="font-semibold hover:text-pen">
                    {l.title}
                  </Link>
                  <p className="text-sm text-ink-3">{pathOf(l.pathSlug)?.title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
