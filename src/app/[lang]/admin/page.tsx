import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { formatDateValue, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { AdminLoading, Forbidden } from "@/components/admin/states";
import { AuditTable } from "@/components/admin/audit-table";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.title };
}

export default async function AdminHome({ params }: PageProps<"/[lang]/admin">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <Overview locale={locale} t={t} />
    </Suspense>
  );
}

async function Overview({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L("/admin"));
  if (!user) return <Forbidden t={t} />;
  const db = getDb();
  const count = (rows: unknown[]) => rows.length;
  const lessons = db.select({ id: s.lessons.id, status: s.lessons.status }).from(s.lessons).all();
  const stats: [string, number][] = [
    [t.admin.stats.paths, count(db.select({ id: s.learningPaths.id }).from(s.learningPaths).all())],
    [t.admin.stats.lessons, lessons.length],
    [t.admin.stats.published, lessons.filter((l) => l.status === "published").length],
    [t.admin.stats.inReview, lessons.filter((l) => l.status === "in_review").length],
    [t.admin.stats.users, count(db.select({ id: s.users.id }).from(s.users).all())],
    [t.admin.stats.videos, count(db.select({ id: s.videos.id }).from(s.videos).all())],
  ];
  const reviewIds = lessons.filter((l) => l.status === "in_review").map((l) => l.id);
  const review = reviewIds.length
    ? db
        .select({ id: s.lessons.id, updatedAt: s.lessons.updatedAt, title: s.lessonTranslations.title })
        .from(s.lessons)
        .innerJoin(s.lessonTranslations, eq(s.lessonTranslations.lessonId, s.lessons.id))
        .where(inArray(s.lessons.id, reviewIds))
        .all()
        .filter((r, i, all) => all.findIndex((x) => x.id === r.id) === i)
    : [];
  const recent = db
    .select({ id: s.auditLog.id, action: s.auditLog.action, entityType: s.auditLog.entityType, entityId: s.auditLog.entityId, detail: s.auditLog.detail, createdAt: s.auditLog.createdAt, who: s.users.name })
    .from(s.auditLog)
    .leftJoin(s.users, eq(s.users.id, s.auditLog.userId))
    .orderBy(desc(s.auditLog.id))
    .limit(8)
    .all();

  return (
    <div className="mt-8 space-y-10">
      <header>
        <h1 className="text-[2rem] font-bold tracking-[-0.02em]">{t.admin.title}</h1>
        <p className="mt-2 max-w-[62ch] text-ink-2">{t.admin.lead}</p>
      </header>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-surface px-5 py-4">
            <dt className="text-sm text-ink-3">{k}</dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="review">
        <h2 id="review" className="text-xl font-bold">
          {t.admin.needsReview}
        </h2>
        {review.length === 0 ? (
          <p className="mt-2 text-ink-2">{t.admin.nothingToReview}</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {review.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <Link href={L(`/admin/content/lessons/${r.id}`)} className="font-medium text-pen underline underline-offset-2">
                  {r.title}
                </Link>
                <span className="text-sm text-ink-3">{formatDateValue(locale, r.updatedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="recent">
        <h2 id="recent" className="text-xl font-bold">
          {t.admin.recentChanges}
        </h2>
        <AuditTable rows={recent} locale={locale} t={t} />
      </section>
    </div>
  );
}
