import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getProjects, getTemplates, getVideos } from "@/lib/content/repo";
import type { VideoView } from "@/lib/content/types";
import { levels, type Level } from "@/lib/db/schema";
import { format, formatIsoDate, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, ExternalLink, PageHeading, cx } from "@/components/ui";
import { VideoEmbed } from "@/components/video-embed";

export async function generateMetadata({ params }: PageProps<"/[lang]/library">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.library.title, description: t.library.metaDescription, alternates: { languages: { en: "/library", ar: "/ar/library" } } };
}

export default async function LibraryPage({ params, searchParams }: PageProps<"/[lang]/library">) {
  const { locale, t } = await resolveLocale(params);
  const L = (p: string) => localePath(locale, p);
  const [templates, projects, videos] = await Promise.all([getTemplates(locale), getProjects(locale), getVideos(locale)]);

  return (
    <Container>
      <PageHeading title={t.library.title} lead={t.library.lead}>
        <nav aria-label={t.library.sections} className="mt-6">
          <ul className="flex flex-wrap gap-2 text-sm">
            {[
              ["#templates", t.library.templatesTitle],
              ["#projects", t.library.projectsTitle],
              ["#videos", t.library.videosTitle],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="inline-flex min-h-10 items-center rounded-full border border-line-strong bg-surface px-3.5 font-medium text-ink-2 hover:border-ink hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeading>

      <section aria-labelledby="templates" className="scroll-mt-24 py-12">
        <h2 id="templates" className="text-2xl font-bold tracking-[-0.01em]">
          {t.library.templatesTitle}
        </h2>
        <p className="mt-2 max-w-[62ch] text-ink-2">{t.library.templatesLead}</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((x) => (
            <li key={x.slug} className="flex flex-col rounded-lg border border-line bg-surface p-5">
              <span className="ltr self-start rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs font-semibold text-ink-2">{x.format.toUpperCase()}</span>
              <h3 className="mt-3 font-semibold">{x.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-2">{x.description}</p>
              <a href={x.filePath} download className="mt-4 text-sm font-semibold text-pen underline underline-offset-2">
                {format(t.library.download, { format: x.format.toUpperCase() })}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="projects" className="scroll-mt-24 border-t border-line py-12">
        <h2 id="projects" className="text-2xl font-bold tracking-[-0.01em]">
          {t.library.projectsTitle}
        </h2>
        <p className="mt-2 max-w-[62ch] text-ink-2">{t.library.projectsLead}</p>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <li key={p.slug} className="flex flex-col rounded-lg border border-line bg-surface p-5">
              <p className="text-sm text-ink-3">
                {t.levels[p.level]} · {format(t.library.hours, { hours: p.hours })}
              </p>
              <h3 className="mt-2 text-lg font-semibold">
                <Link href={L(`/library/projects/${p.slug}`)} className="hover:text-pen">
                  {p.title}
                </Link>
              </h3>
              <p className="mt-1 flex-1 leading-relaxed text-ink-2">{p.summary}</p>
              <Link href={L(`/library/projects/${p.slug}`)} className="mt-4 text-sm font-semibold text-pen underline underline-offset-2">
                {t.library.viewProject}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="videos" className="scroll-mt-24 border-t border-line py-12">
        <h2 id="videos" className="text-2xl font-bold tracking-[-0.01em]">
          {t.library.videosTitle}
        </h2>
        <p className="mt-2 max-w-[62ch] text-ink-2">{t.library.videosLead}</p>
        <Suspense fallback={<VideoGrid videos={videos} level={null} locale={locale} t={t} />}>
          <FilteredVideos videos={videos} locale={locale} t={t} searchParams={searchParams} />
        </Suspense>
      </section>
    </Container>
  );
}

async function FilteredVideos({ videos, locale, t, searchParams }: { videos: VideoView[]; locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/library">["searchParams"] }) {
  const raw = (await searchParams).level;
  const level = typeof raw === "string" && (levels as readonly string[]).includes(raw) ? (raw as Level) : null;
  return <VideoGrid videos={videos} level={level} locale={locale} t={t} />;
}

function VideoGrid({ videos, level, locale, t }: { videos: VideoView[]; level: Level | null; locale: Locale; t: Dictionary }) {
  const used = levels.filter((l) => videos.some((v) => v.level === l));
  const visible = videos.filter((v) => !level || v.level === level);
  const base = localePath(locale, "/library");
  return (
    <>
      <nav aria-label={t.library.filterLevel} className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {[null, ...used].map((l) => (
            <li key={l ?? "all"}>
              <Link
                href={l ? `${base}?level=${encodeURIComponent(l)}#videos` : `${base}#videos`}
                aria-current={l === level ? "true" : undefined}
                className={cx(
                  "inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-medium",
                  l === level ? "border-pen bg-pen text-on-pen" : "border-line-strong bg-surface text-ink-2 hover:border-ink hover:text-ink",
                )}
              >
                {l ? t.levels[l] : t.library.filterAll}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {visible.length === 0 ? (
        <p className="mt-6 text-ink-2">{t.library.emptyVideos}</p>
      ) : (
        <ul className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((v) => (
            <li key={v.youtubeId} className="flex flex-col">
              <VideoEmbed youtubeId={v.youtubeId} title={v.title} playLabel={format(t.library.play, { title: v.title })} notice={t.library.embedNotice} />
              <h3 className="mt-3 font-semibold leading-snug" lang="en" dir="ltr">
                {v.title}
              </h3>
              <p className="mt-1 text-sm text-ink-2">
                {format(t.library.by, { creator: "" })}
                <ExternalLink href={v.creatorUrl} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
                  {v.creator}
                </ExternalLink>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{v.description}</p>
              <p className="mt-2 text-xs text-ink-3">
                {t.levels[v.level]}
                {v.language === "en" && <> · {t.library.spokenLanguage}</>}
                {v.verifiedOn && <> · {format(t.library.videoVerified, { date: formatIsoDate(locale, v.verifiedOn) })}</>}
              </p>
              <ExternalLink
                href={`https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId)}`}
                newTabLabel={t.common.opensInNewTab}
                className="mt-2 text-sm font-semibold text-pen underline underline-offset-2"
              >
                {t.library.watch}
              </ExternalLink>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
