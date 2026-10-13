import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getSearchDocs } from "@/lib/search-index";
import { paginate, searchDocs } from "@/lib/search";
import { format, localePath, plural, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, cx } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.search.title, description: t.search.label, alternates: { languages: { en: "/search", ar: "/ar/search" } } };
}

const PAGE_SIZE = 8;

export default async function SearchPage({ params, searchParams }: PageProps<"/[lang]/search">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Container className="py-10 sm:py-14">
      <h1 className="text-[2.2rem] font-bold tracking-[-0.02em]">{t.search.title}</h1>
      <Suspense fallback={<SearchForm q="" locale={locale} t={t} />}>
        <Results locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

function SearchForm({ q, locale, t }: { q: string; locale: Locale; t: Dictionary }) {
  return (
    <form role="search" action={localePath(locale, "/search")} className="mt-5 flex max-w-[44rem] gap-2">
      <label htmlFor="q" className="sr-only">
        {t.search.label}
      </label>
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder={t.search.placeholder}
          className="h-12 w-full rounded-md border border-line-strong bg-surface pe-3 ps-10 text-ink placeholder:text-ink-3"
        />
      </div>
      <button type="submit" className="h-12 rounded-md bg-pen px-5 font-semibold text-on-pen hover:bg-pen-hover">
        {t.search.button}
      </button>
    </form>
  );
}

async function Results({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/search">["searchParams"] }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 200) : "";
  const pageNum = Number(typeof sp.page === "string" ? sp.page : "1");
  const hits = q.trim() ? searchDocs(await getSearchDocs(locale), q) : [];
  const { items, page, totalPages, total } = paginate(hits, pageNum, PAGE_SIZE);
  const base = localePath(locale, "/search");
  const href = (p: number) => `${base}?q=${encodeURIComponent(q)}${p > 1 ? `&page=${p}` : ""}`;
  const noHelp = t.search.noResultsHelp.split("{paths}");

  return (
    <>
      <SearchForm q={q} locale={locale} t={t} />
      <div className="mt-8 max-w-[52rem]" aria-live="polite">
        {!q.trim() ? (
          <div className="text-ink-2">
            <p>{t.search.intro}</p>
            <p className="mt-4 text-sm font-medium text-ink-3">{t.search.popular}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {t.search.popularTerms.map((term) => (
                <li key={term}>
                  <Link href={`${base}?q=${encodeURIComponent(term)}`} className="inline-block rounded-md border border-line px-3 py-1.5 text-sm text-ink-2 hover:border-pen hover:text-pen">
                    {term}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : total === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong p-8">
            <p className="font-semibold">{format(t.search.noResults, { q })}</p>
            <p className="mt-1 text-ink-2">
              {noHelp[0]}
              <Link href={localePath(locale, "/paths")} className="text-pen underline">
                {t.search.pathsLink}
              </Link>
              {noHelp[1]}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-3">
              {format(t.search.summary, { results: format(plural(locale, total, t.common.results), { count: total }), q })}
              {totalPages > 1 && format(t.search.pageOf, { page, total: totalPages })}
            </p>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {items.map((h) => (
                <li key={h.doc.id} className="py-5">
                  <p className="text-sm text-ink-3">
                    <span className="font-medium text-ink-2">{t.search.kinds[h.doc.kind]}</span>
                    {locale === "ar" ? "، " : ", "}
                    {h.doc.context}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    <Link href={h.doc.href} className="hover:text-pen">
                      {h.doc.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-2">{h.snippet}</p>
                </li>
              ))}
            </ol>
            {totalPages > 1 && (
              <nav aria-label={t.search.pagesLabel} className="mt-6 flex flex-wrap items-center gap-2">
                {page > 1 && (
                  <Link href={href(page - 1)} className="rounded-md border border-line px-3 py-2 text-sm hover:border-pen">
                    {t.search.previous}
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={href(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={cx("min-w-10 rounded-md border px-3 py-2 text-center text-sm tabular-nums", p === page ? "border-pen bg-pen-soft font-semibold" : "border-line hover:border-pen")}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={href(page + 1)} className="rounded-md border border-line px-3 py-2 text-sm hover:border-pen">
                    {t.search.next}
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
