import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getPaths } from "@/lib/content/repo";
import type { PathView } from "@/lib/content/types";
import { levels, type Level } from "@/lib/db/schema";
import { format, formatMinutes, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, LevelRange, PageHeading, StatusBadge, cx } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/paths">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.paths.title, description: t.paths.metaDescription, alternates: { languages: { en: "/paths", ar: "/ar/paths" } } };
}

function PathCard({ p, locale, t }: { p: PathView; locale: Locale; t: Dictionary }) {
  const total = p.lessons.length + p.plannedCount;
  const href = localePath(locale, `/paths/${p.slug}`);
  return (
    <li className="flex flex-col rounded-lg border border-line bg-surface p-6">
      <div className="flex flex-wrap items-center gap-3">
        <LevelRange
          from={t.levels[p.startsAt]}
          to={t.levels[p.leadsTo]}
          label={format(t.levelRange, { from: t.levels[p.startsAt], to: t.levels[p.leadsTo] })}
          rtl={locale === "ar"}
        />
        {p.status === "planned" && <StatusBadge label={t.paths.inDevelopmentTitle} tone="warn" />}
      </div>
      <h2 className="mt-3 text-2xl font-bold tracking-[-0.01em]">
        <Link href={href} className="hover:text-pen">
          {p.title}
        </Link>
      </h2>
      <p className="mt-2 leading-relaxed text-ink-2">{p.summary}</p>
      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-ink-3">{t.paths.modules}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{p.modules.length}</dd>
        </div>
        <div>
          <dt className="text-ink-3">{t.paths.lessons}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {p.lessons.length} / {total}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">{t.paths.readingTime}</dt>
          <dd className="mt-0.5 font-semibold">{formatMinutes(locale, p.totalMinutes)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-ink-3">{format(t.paths.publishedOf, { published: p.lessons.length, total })}</p>
      <p className="mt-2 text-sm text-ink-2">{format(t.paths.skills, { skills: p.skills.map((id) => t.skills[id]).join(locale === "ar" ? "، " : ", ") })}</p>
      <div className="mt-auto pt-6">
        <Link href={href} className="font-semibold text-pen underline underline-offset-2 hover:text-pen-hover">
          {format(t.paths.viewPath, { title: p.title })}
        </Link>
      </div>
    </li>
  );
}

function Catalog({ paths, level, locale, t }: { paths: PathView[]; level: Level | null; locale: Locale; t: Dictionary }) {
  const published = paths.filter((p) => p.status === "published" && (!level || p.startsAt === level));
  const planned = paths.filter((p) => p.status === "planned" && (!level || p.startsAt === level));
  const used = new Set(paths.map((p) => p.startsAt));
  const base = localePath(locale, "/paths");
  return (
    <>
      <nav aria-label={t.paths.filterLabel} className="mt-8">
        <p className="text-sm font-semibold text-ink-3">{t.paths.filterLabel}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {[null, ...levels.filter((l) => used.has(l))].map((l) => {
            const active = l === level;
            return (
              <li key={l ?? "all"}>
                <Link
                  href={l ? `${base}?level=${encodeURIComponent(l)}` : base}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm font-medium",
                    active ? "border-pen bg-pen text-on-pen" : "border-line-strong bg-surface text-ink-2 hover:border-ink hover:text-ink",
                  )}
                >
                  {l ? t.levels[l] : t.paths.allLevels}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {published.length === 0 && planned.length === 0 ? (
        <p className="mt-10 text-ink-2">{t.paths.noMatch}</p>
      ) : (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {published.map((p) => (
            <PathCard key={p.slug} p={p} locale={locale} t={t} />
          ))}
        </ul>
      )}
      {planned.length > 0 && (
        <section aria-labelledby="in-development" className="mt-14">
          <h2 id="in-development" className="text-xl font-bold">
            {t.paths.inDevelopmentTitle}
          </h2>
          <p className="mt-2 max-w-[60ch] text-ink-2">{t.paths.inDevelopmentLead}</p>
          <ul className="mt-6 grid gap-6 md:grid-cols-2">
            {planned.map((p) => (
              <PathCard key={p.slug} p={p} locale={locale} t={t} />
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

async function FilteredCatalog({ paths, locale, t, searchParams }: { paths: PathView[]; locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/paths">["searchParams"] }) {
  const raw = (await searchParams).level;
  const level = typeof raw === "string" && (levels as readonly string[]).includes(raw) ? (raw as Level) : null;
  return <Catalog paths={paths} level={level} locale={locale} t={t} />;
}

export default async function PathsPage({ params, searchParams }: PageProps<"/[lang]/paths">) {
  const { locale, t } = await resolveLocale(params);
  const paths = await getPaths(locale);
  return (
    <Container>
      <PageHeading title={t.paths.title} lead={t.paths.lead} />
      <Suspense fallback={<Catalog paths={paths} level={null} locale={locale} t={t} />}>
        <FilteredCatalog paths={paths} locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
