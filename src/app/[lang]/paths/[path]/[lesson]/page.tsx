import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLesson, getPath, getPaths, getTemplates, getVideos, publicQuestions } from "@/lib/content/repo";
import type { LessonDetail, PathView } from "@/lib/content/types";
import { renderMarkdown } from "@/lib/markdown";
import { getCurrentUser } from "@/lib/auth/dal";
import { getBestAttempt, getProgressMap, isBookmarked, type LessonStatus } from "@/lib/progress";
import { format, formatIsoDate, formatMinutes, localePath, plural, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, ExternalLink, FallbackNotice } from "@/components/ui";
import { ClockIcon } from "@/components/icons";
import { LessonNav } from "@/components/lesson/lesson-nav";
import { InlineText } from "@/components/inline-text";
import { QuizForm } from "@/components/lesson/quiz-form";
import { BookmarkButton, CompleteToggle, SignInToSave, VisitRecorder } from "@/components/lesson/lesson-actions";
import { VideoEmbed } from "@/components/video-embed";

// Content pages are prerendered for every known slug. Blocking here lets unknown slugs return a real 404
// instead of a streamed soft 404 (dynamicParams isn't available with Cache Components).
export const instant = false;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const paths = await getPaths(params.lang === "ar" ? "ar" : "en");
  return paths.flatMap((p) => p.lessons.map((l) => ({ path: p.slug, lesson: l.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/paths/[path]/[lesson]">): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { path, lesson } = await params;
  const l = await getLesson(locale, path, lesson);
  if (!l) return {};
  return {
    title: l.title,
    description: l.summary,
    alternates: { languages: { en: `/paths/${path}/${lesson}`, ar: `/ar/paths/${path}/${lesson}` } },
    openGraph: { title: l.title, description: l.summary, type: "article" },
  };
}

const h2 = "text-2xl font-bold tracking-[-0.01em] scroll-mt-24";

export default async function LessonPage({ params }: PageProps<"/[lang]/paths/[path]/[lesson]">) {
  const { locale, t } = await resolveLocale(params);
  const { path: pathSlug, lesson: lessonSlug } = await params;
  const [path, lesson] = await Promise.all([getPath(locale, pathSlug), getLesson(locale, pathSlug, lessonSlug)]);
  if (!path || !lesson) notFound();

  const L = (p: string) => localePath(locale, p);
  const index = path.lessons.findIndex((l) => l.key === lesson.key);
  const previous = index > 0 ? path.lessons[index - 1] : null;
  const next = index >= 0 && index < path.lessons.length - 1 ? path.lessons[index + 1] : null;
  const lessonModule = path.modules.find((m) => m.slug === lesson.moduleSlug);
  const selfHref = L(`/paths/${path.slug}/${lesson.slug}`);
  const loginHref = `${L("/login")}?next=${encodeURIComponent(selfHref)}`;
  const signupHref = `${L("/signup")}?next=${encodeURIComponent(selfHref)}`;
  const [bodyHtml, exerciseHtml, answerHtml, videos, templates] = await Promise.all([
    renderMarkdown(lesson.body),
    renderMarkdown(lesson.exercise.brief),
    renderMarkdown(lesson.exercise.modelAnswer),
    getVideos(locale),
    getTemplates(locale),
  ]);
  const lessonVideos = videos.filter((v) => v.relatedLessons.includes(lesson.key));
  const lessonTemplates = templates.filter((x) => x.relatedLessons.includes(lesson.key));
  const skillNames = lesson.skills.map((id) => t.skills[id]);
  const signIn = (
    <SignInToSave template={t.lesson.signInToSave} loginHref={loginHref} signupHref={signupHref} loginText={t.lesson.logIn} signupText={t.lesson.createFree} />
  );

  const toc = [
    ...lesson.headings,
    ...(lesson.keyTerms.length ? [{ id: "key-terms", text: t.lesson.keyTerms }] : []),
    { id: "mistakes", text: t.lesson.mistakes },
    { id: "exercise", text: format(t.lesson.exercise, { title: "" }).replace(/[:：]\s*$/, "") },
    { id: "knowledge-check", text: t.lesson.knowledgeCheck },
    ...(lessonVideos.length ? [{ id: "videos", text: t.lesson.videos }] : []),
    { id: "references", text: t.lesson.references },
  ];

  return (
    <Container className="pb-8 pt-6">
      <VisitRecorder lessonKey={lesson.key} />
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={L("/paths")} className="hover:text-pen">
              {t.lesson.breadcrumbPaths}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={L(`/paths/${path.slug}`)} className="hover:text-pen">
              {path.title}
            </Link>
          </li>
          {lessonModule && (
            <>
              <li aria-hidden>/</li>
              <li className="text-ink-2">{lessonModule.title}</li>
            </>
          )}
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:grid-cols-[15.5rem_minmax(0,1fr)_13rem]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pb-6 pe-2">
            <Suspense fallback={<LessonNav path={path} currentKey={lesson.key} statuses={null} locale={locale} t={t} />}>
              <NavWithProgress path={path} currentKey={lesson.key} locale={locale} t={t} />
            </Suspense>
          </div>
        </aside>

        <article className="min-w-0" aria-labelledby="lesson-title">
          <header className="border-b border-line pb-7">
            {lesson.fallback && (
              <div className="mb-5">
                <FallbackNotice text={t.common.notTranslated} />
              </div>
            )}
            <p className="text-sm font-medium text-ink-3">{format(t.lesson.position, { n: lesson.position ?? 1, total: path.lessons.length })}</p>
            <h1
              id="lesson-title"
              lang={lesson.fallback ? "en" : undefined}
              className="mt-2 max-w-[26ch] text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]"
            >
              {lesson.title}
            </h1>
            <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-ink-2">{lesson.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon size={16} /> {formatMinutes(locale, lesson.minutes)}
              </span>
              <span>{format(t.common.level, { level: t.levels[lesson.level] })}</span>
              <span>{format(t.common.reviewed, { date: formatIsoDate(locale, lesson.reviewedOn) })}</span>
            </div>
            <div className="mt-5">
              <Suspense fallback={<div className="h-10" />}>
                <HeaderActions lessonKey={lesson.key} locale={locale} t={t} signIn={signIn} />
              </Suspense>
            </div>
          </header>

          <details className="mt-6 rounded-lg border border-line bg-surface lg:hidden">
            <summary className="cursor-pointer px-4 py-3 font-semibold">{format(t.lesson.allLessonsIn, { path: path.title })}</summary>
            <div className="border-t border-line px-3 py-4">
              <Suspense fallback={<LessonNav path={path} currentKey={lesson.key} statuses={null} locale={locale} t={t} />}>
                <NavWithProgress path={path} currentKey={lesson.key} locale={locale} t={t} />
              </Suspense>
            </div>
          </details>

          <div lang={lesson.fallback ? "en" : undefined} dir={lesson.fallback ? "ltr" : undefined}>
            <section aria-labelledby="objectives" className="mt-8 grid gap-6 rounded-lg border border-line bg-surface p-6 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 id="objectives" className="font-semibold">
                  {t.lesson.afterThis}
                </h2>
                <ul className="mt-3 space-y-2.5 text-[0.97rem] leading-relaxed">
                  {lesson.objectives.map((o) => (
                    <li key={o} className="flex gap-2.5">
                      <span aria-hidden className="mt-[0.7rem] h-1.5 w-3 shrink-0 bg-highlighter" />
                      <span>
                        <InlineText text={o} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:border-s md:border-line md:ps-6">
                <h2 className="font-semibold">{t.lesson.beforeStart}</h2>
                {lesson.prerequisites.length ? (
                  <ul className="mt-3 space-y-2 text-[0.95rem] leading-relaxed text-ink-2">
                    {lesson.prerequisites.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[0.95rem] text-ink-2">{t.lesson.noPrereq}</p>
                )}
                <h2 className="mt-5 font-semibold">{t.lesson.skills}</h2>
                <p className="mt-2 text-[0.95rem] text-ink-2">{skillNames.join(locale === "ar" ? "، " : ", ")}</p>
              </div>
            </section>

            <div className="prose-lesson mt-10" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

            {lesson.keyTerms.length > 0 && (
              <section aria-labelledby="key-terms" className="mt-14 max-w-[68ch]">
                <h2 id="key-terms" className={h2}>
                  {t.lesson.keyTerms}
                </h2>
                <dl className="mt-4 divide-y divide-line border-y border-line">
                  {lesson.keyTerms.map((k) => (
                    <div key={k.term} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
                      <dt className="font-semibold">{k.term}</dt>
                      <dd className="font-serif text-[0.98rem] leading-relaxed text-ink-2">
                        <InlineText text={k.definition} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <section aria-labelledby="mistakes" className="mt-14 max-w-[68ch]">
              <h2 id="mistakes" className={h2}>
                {t.lesson.mistakes}
              </h2>
              <ul className="mt-4 space-y-4">
                {lesson.mistakes.map((m) => (
                  <li key={m.mistake} className="grid gap-2 rounded-lg border border-line bg-surface p-5">
                    <p className="flex items-start gap-2.5 font-medium leading-snug">
                      <span className="w-16 shrink-0 rounded bg-fail-soft px-1.5 text-center text-xs font-semibold leading-5 text-fail">{t.lesson.mistake}</span>
                      <span>
                        <InlineText text={m.mistake} />
                      </span>
                    </p>
                    <p className="flex items-start gap-2.5 leading-relaxed text-ink-2">
                      <span className="mt-0.5 w-16 shrink-0 rounded bg-pass-soft px-1.5 text-center text-xs font-semibold leading-5 text-pass">{t.lesson.instead}</span>
                      <span>
                        <InlineText text={m.fix} />
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="exercise" className="mt-14 max-w-[68ch]">
              <h2 id="exercise" className={h2}>
                {format(t.lesson.exercise, { title: lesson.exercise.title })}
              </h2>
              <div className="prose-lesson mt-4" dangerouslySetInnerHTML={{ __html: exerciseHtml }} />
              <details className="group mt-6 rounded-lg border border-line-strong bg-surface">
                <summary className="cursor-pointer list-none px-5 py-4 font-semibold marker:hidden">
                  <span className="group-open:hidden">{t.lesson.showAnswer}</span>
                  <span className="hidden group-open:inline">{t.lesson.hideAnswer}</span>
                  <span className="ms-2 text-sm font-normal text-ink-3">{t.lesson.tryFirst}</span>
                </summary>
                <div className="prose-lesson border-t border-line px-5 py-5" dangerouslySetInnerHTML={{ __html: answerHtml }} />
              </details>
            </section>

            <section aria-labelledby="knowledge-check" className="mt-14 max-w-[68ch]">
              <h2 id="knowledge-check" className={h2}>
                {t.lesson.knowledgeCheck}
              </h2>
              <p className="mt-2 text-ink-2">
                {format(t.lesson.knowledgeCheckLead, { questions: format(plural(locale, lesson.quiz.length, t.common.questions), { count: lesson.quiz.length }) })}
              </p>
              <div className="mt-6">
                <QuizForm
                  subject={`lesson:${lesson.key}`}
                  questions={publicQuestions(lesson.quiz)}
                  locale={locale}
                  t={t.quiz}
                  loginHref={loginHref}
                  dashboardHref={L("/dashboard")}
                />
              </div>
            </section>
          </div>

          {lessonTemplates.length > 0 && (
            <section aria-labelledby="templates" className="mt-14 max-w-[68ch]">
              <h2 id="templates" className={h2}>
                {t.lesson.templates}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {lessonTemplates.map((x) => (
                  <li key={x.slug} className="rounded-lg border border-line bg-surface p-4">
                    <p className="font-semibold">{x.title}</p>
                    <p className="mt-1 text-sm text-ink-2">{x.description}</p>
                    <a href={x.filePath} download className="mt-3 inline-block text-sm font-semibold text-pen underline underline-offset-2">
                      {format(t.library.download, { format: x.format.toUpperCase() })}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lessonVideos.length > 0 && (
            <section aria-labelledby="videos" className="mt-14 max-w-[68ch]">
              <h2 id="videos" className={h2}>
                {t.lesson.videos}
              </h2>
              <p className="mt-2 text-sm text-ink-3">{t.lesson.videosNote}</p>
              <ul className="mt-4 grid gap-6 sm:grid-cols-2">
                {lessonVideos.map((v) => (
                  <li key={v.youtubeId}>
                    <VideoEmbed youtubeId={v.youtubeId} title={v.title} playLabel={format(t.library.play, { title: v.title })} notice={t.library.embedNotice} />
                    <p className="mt-2 font-semibold leading-snug" lang="en" dir="ltr">
                      {v.title}
                    </p>
                    <p className="text-sm text-ink-2">
                      {format(t.library.by, { creator: "" })}
                      <ExternalLink href={v.creatorUrl} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
                        {v.creator}
                      </ExternalLink>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="references" className="mt-14 max-w-[68ch]">
            <h2 id="references" className={h2}>
              {t.lesson.references}
            </h2>
            <ul className="mt-4 space-y-2">
              {lesson.references.map((r) => (
                <li key={r.url}>
                  <ExternalLink href={r.url} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2 hover:text-pen-hover">
                    {r.title}
                  </ExternalLink>
                  <span className="text-sm text-ink-3">
                    {locale === "ar" ? "، " : ", "}
                    {r.publisher}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-3">{format(t.lesson.reviewNote, { date: formatIsoDate(locale, lesson.reviewedOn) })}</p>
          </section>

          <section aria-label={t.lesson.finished} className="mt-14 max-w-[68ch] rounded-lg border border-line-strong bg-surface p-6">
            <Suspense fallback={<div className="h-11" />}>
              <CompletionPanel lesson={lesson} locale={locale} t={t} signIn={signIn} />
            </Suspense>
            <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-2">
              {previous ? (
                <Link href={L(`/paths/${path.slug}/${previous.slug}`)} className="group rounded-md p-2 hover:bg-surface-2">
                  <span className="block text-sm text-ink-3">{t.lesson.previous}</span>
                  <span className="font-semibold group-hover:text-pen">{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={L(`/paths/${path.slug}/${next.slug}`)} className="group rounded-md p-2 text-end hover:bg-surface-2">
                  <span className="block text-sm text-ink-3">{t.lesson.next}</span>
                  <span className="font-semibold group-hover:text-pen">{next.title}</span>
                </Link>
              ) : (
                <Link href={L("/paths")} className="group rounded-md p-2 text-end hover:bg-surface-2">
                  <span className="block text-sm text-ink-3">{t.lesson.endOfPath}</span>
                  <span className="font-semibold group-hover:text-pen">{t.lesson.chooseNext}</span>
                </Link>
              )}
            </div>
          </section>
        </article>

        <aside className="hidden xl:block">
          <nav aria-label={t.lesson.onThisPage} className="sticky top-24 text-sm">
            <p className="font-semibold text-ink">{t.lesson.onThisPage}</p>
            <ul className="mt-3 space-y-2 border-s border-line">
              {toc.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="-ms-px block border-s border-transparent ps-3 leading-snug text-ink-2 hover:border-pen hover:text-pen">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </Container>
  );
}

async function NavWithProgress({ path, currentKey, locale, t }: { path: PathView; currentKey: string; locale: Locale; t: Dictionary }) {
  const user = await getCurrentUser();
  let statuses: Map<string, LessonStatus> | null = null;
  if (user) {
    const map = getProgressMap(user.id);
    statuses = new Map(path.lessons.map((l) => [l.key, map.get(l.key)?.status ?? "not-started"]));
  }
  return <LessonNav path={path} currentKey={currentKey} statuses={statuses} locale={locale} t={t} />;
}

async function HeaderActions({ lessonKey, locale, t, signIn }: { lessonKey: string; locale: Locale; t: Dictionary; signIn: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return signIn;
  return (
    <BookmarkButton
      lessonKey={lessonKey}
      initial={isBookmarked(user.id, lessonKey)}
      locale={locale}
      labels={{ save: t.lesson.saveForLater, saved: t.lesson.savedBookmark }}
    />
  );
}

async function CompletionPanel({ lesson, locale, t, signIn }: { lesson: LessonDetail; locale: Locale; t: Dictionary; signIn: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div>
        <h2 className="text-lg font-bold">{t.lesson.finished}</h2>
        <div className="mt-2">{signIn}</div>
      </div>
    );
  }
  const status = getProgressMap(user.id).get(lesson.key)?.status;
  const best = getBestAttempt(user.id, `lesson:${lesson.key}`);
  return (
    <div>
      <h2 className="text-lg font-bold">{t.lesson.finished}</h2>
      <p className="mt-1 text-[0.95rem] text-ink-2">{best ? format(t.lesson.bestScore, { score: best.score, total: best.total }) : t.lesson.takeCheck}</p>
      <div className="mt-4">
        <CompleteToggle
          lessonKey={lesson.key}
          initial={status === "completed"}
          locale={locale}
          labels={{ mark: t.lesson.markComplete, completed: t.lesson.completed, hint: t.lesson.markIncompleteHint }}
        />
      </div>
    </div>
  );
}
