import type { Metadata } from "next";
import { Suspense } from "react";
import { desc, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { AuditTable } from "@/components/admin/audit-table";
import { AdminLoading, Forbidden } from "@/components/admin/states";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/audit">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.audit };
}

export default async function AuditPage({ params }: PageProps<"/[lang]/admin/audit">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <Audit locale={locale} t={t} />
    </Suspense>
  );
}

async function Audit({ locale, t }: { locale: Locale; t: Dictionary }) {
  const user = await requireStaffPage(localePath(locale, "/admin/audit"));
  if (!user) return <Forbidden t={t} />;
  const rows = getDb()
    .select({ id: s.auditLog.id, action: s.auditLog.action, entityType: s.auditLog.entityType, entityId: s.auditLog.entityId, detail: s.auditLog.detail, createdAt: s.auditLog.createdAt, who: s.users.name })
    .from(s.auditLog)
    .leftJoin(s.users, eq(s.users.id, s.auditLog.userId))
    .orderBy(desc(s.auditLog.id))
    .limit(200)
    .all();
  return (
    <div className="mt-8">
      <h1 className="text-[2rem] font-bold tracking-[-0.02em]">{t.admin.audit}</h1>
      <AuditTable rows={rows} locale={locale} t={t} />
    </div>
  );
}
