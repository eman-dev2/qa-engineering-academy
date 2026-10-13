import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { formatIsoDate, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { StatusBadge } from "@/components/ui";
import { AdminLoading, Forbidden } from "@/components/admin/states";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/certifications">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.certifications };
}

export default async function AdminCertsPage({ params }: PageProps<"/[lang]/admin/certifications">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <List locale={locale} t={t} />
    </Suspense>
  );
}

async function List({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L("/admin/certifications"));
  if (!user) return <Forbidden t={t} />;
  const certs = getDb().select().from(s.certifications).orderBy(asc(s.certifications.position), asc(s.certifications.id)).all();
  return (
    <div className="mt-8">
      <h1 className="text-[2rem] font-bold tracking-[-0.02em]">{t.admin.certifications}</h1>
      <p className="mt-2 max-w-[70ch] text-ink-2">{t.admin.certs.lead}</p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-ink-3">
              <th scope="col" className="px-5 py-2 text-start font-medium">{t.admin.certs.code}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colTitle}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.certs.stream}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colStatus}</th>
              <th scope="col" className="px-5 py-2 text-end font-medium">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="ltr px-5 py-2.5 font-mono text-xs font-semibold">{c.code}</td>
                <td className="px-3 py-2.5" lang="en">
                  {c.name}
                </td>
                <td className="px-3 py-2.5 text-ink-2">{t.certs.streams[c.stream] ?? c.stream}</td>
                <td className="px-3 py-2.5">
                  {c.verified ? (
                    <StatusBadge label={`${t.admin.certs.verified}${c.reviewedOn ? ` · ${formatIsoDate(locale, c.reviewedOn)}` : ""}`} tone="pass" />
                  ) : (
                    <StatusBadge label={t.admin.certs.unverified} />
                  )}
                </td>
                <td className="px-5 py-2.5 text-end">
                  <Link href={L(`/admin/certifications/${c.id}`)} className="font-semibold text-pen underline underline-offset-2">
                    {t.admin.certs.editCert}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
