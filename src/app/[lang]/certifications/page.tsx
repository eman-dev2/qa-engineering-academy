import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCertifications } from "@/lib/content/repo";
import type { CertificationView } from "@/lib/content/types";
import { certificationStreams } from "@/content/certification-streams";
import { format, formatIsoDate, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, ExternalLink, PageHeading, cx } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/[lang]/certifications">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.certs.title, description: t.certs.metaDescription, alternates: { languages: { en: "/certifications", ar: "/ar/certifications" } } };
}

type Filter = "all" | "verified";

export default async function CertificationsPage({ params, searchParams }: PageProps<"/[lang]/certifications">) {
  const { locale, t } = await resolveLocale(params);
  const certs = await getCertifications(locale);
  const verified = certs.filter((c) => c.verified).length;
  return (
    <Container>
      <PageHeading title={t.certs.title} lead={format(t.certs.lead, { total: certs.length, verified })} />
      <Suspense fallback={<Directory certs={certs} filter="all" stream={null} locale={locale} t={t} />}>
        <FilteredDirectory certs={certs} locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
      <section className="mt-16 max-w-[62ch] rounded-lg border border-line bg-surface p-6">
        <h2 className="font-bold">{t.certs.howTitle}</h2>
        <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[0.95rem] leading-relaxed text-ink-2">
          {t.certs.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>
    </Container>
  );
}

async function FilteredDirectory({
  certs,
  locale,
  t,
  searchParams,
}: {
  certs: CertificationView[];
  locale: Locale;
  t: Dictionary;
  searchParams: PageProps<"/[lang]/certifications">["searchParams"];
}) {
  const sp = await searchParams;
  const filter: Filter = sp.show === "verified" ? "verified" : "all";
  const stream = certificationStreams.find((s) => s === sp.stream) ?? null;
  return <Directory certs={certs} filter={filter} stream={stream} locale={locale} t={t} />;
}

function filterHref(locale: Locale, filter: Filter, stream: string | null) {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("show", filter);
  if (stream) p.set("stream", stream);
  const q = p.toString();
  const base = localePath(locale, "/certifications");
  return q ? `${base}?${q}` : base;
}

function Directory({ certs, filter, stream, locale, t }: { certs: CertificationView[]; filter: Filter; stream: string | null; locale: Locale; t: Dictionary }) {
  const visible = certs.filter((c) => (filter === "all" || c.verified) && (!stream || c.stream === stream));
  const streams = certificationStreams.filter((s) => !stream || s === stream);
  const streamName = (s: string) => t.certs.streams[s] ?? s;

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:flex-wrap sm:items-center">
        <div role="group" aria-label={t.certs.verification} className="flex gap-1">
          {(["all", "verified"] as const).map((f) => (
            <Link
              key={f}
              href={filterHref(locale, f, stream)}
              aria-current={filter === f ? "true" : undefined}
              className={cx(
                "rounded-md border px-3 py-1.5 text-sm font-medium",
                filter === f ? "border-pen bg-pen-soft text-ink" : "border-line text-ink-2 hover:border-line-strong",
              )}
            >
              {f === "all" ? t.certs.all : t.certs.verifiedOnly}
            </Link>
          ))}
        </div>
        <div role="group" aria-label={t.certs.stream} className="flex flex-wrap gap-1">
          <Link
            href={filterHref(locale, filter, null)}
            aria-current={!stream ? "true" : undefined}
            className={cx("rounded-md px-2.5 py-1.5 text-sm", !stream ? "font-semibold text-ink underline decoration-2 underline-offset-4" : "text-ink-2 hover:text-ink")}
          >
            {t.certs.allStreams}
          </Link>
          {certificationStreams.map((s) => (
            <Link
              key={s}
              href={filterHref(locale, filter, s)}
              aria-current={stream === s ? "true" : undefined}
              className={cx("rounded-md px-2.5 py-1.5 text-sm", stream === s ? "font-semibold text-ink underline decoration-2 underline-offset-4" : "text-ink-2 hover:text-ink")}
            >
              {streamName(s)}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-3" aria-live="polite">
        {format(t.certs.showing, { shown: visible.length, total: certs.length })}
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-line-strong p-8 text-center">
          <p className="font-semibold">{t.certs.emptyTitle}</p>
          <p className="mt-1 text-ink-2">
            <Link href={filterHref(locale, "all", stream)} className="text-pen underline">
              {t.certs.emptyLink}
            </Link>{" "}
            {t.certs.emptyRest}
          </p>
        </div>
      ) : (
        streams.map((s, i) => {
          const items = visible.filter((c) => c.stream === s);
          if (items.length === 0) return null;
          return (
            <section key={s} aria-labelledby={`stream-${i}`} className="mt-10">
              <h2 id={`stream-${i}`} className="text-xl font-bold">
                {streamName(s)}
              </h2>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {items.map((c) => (
                  <CertRow key={c.slug} cert={c} locale={locale} t={t} />
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}

function CertRow({ cert, locale, t }: { cert: CertificationView; locale: Locale; t: Dictionary }) {
  const e = cert.exam;
  return (
    <li className="grid gap-2 py-4 md:grid-cols-[8.5rem_1fr_auto] md:items-center md:gap-6">
      <span className="ltr font-mono text-sm font-semibold text-ink-2">{cert.code}</span>
      <div>
        {cert.verified ? (
          <Link href={localePath(locale, `/certifications/${cert.slug}`)} className="font-semibold hover:text-pen" lang="en">
            {cert.name}
          </Link>
        ) : (
          <span className="font-semibold" lang="en">
            {cert.name}
          </span>
        )}
        {cert.version && <span className="ms-2 text-sm text-ink-3">{cert.version}</span>}
        {cert.verified && e && e.questions != null && (
          <p className="mt-0.5 text-sm text-ink-2">
            {format(t.certs.examSummary, { questions: e.questions, pass: e.passingScore ?? "–", points: e.totalPoints ?? "–", minutes: e.durationMinutes ?? "–" })}
          </p>
        )}
      </div>
      <div className="text-sm">
        {cert.verified && cert.reviewedOn ? (
          <span className="inline-flex items-center gap-1 text-pass">
            <CheckIcon size={15} /> {format(t.certs.verifiedOn, { date: formatIsoDate(locale, cert.reviewedOn) })}
          </span>
        ) : (
          <span className="text-ink-3">
            {t.certs.notVerified}{" "}
            <ExternalLink href={cert.sourceUrl} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
              {t.certs.officialPage}
            </ExternalLink>
          </span>
        )}
      </div>
    </li>
  );
}
