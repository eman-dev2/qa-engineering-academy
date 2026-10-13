import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { saveCertification } from "@/app/actions/admin";
import { localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { ExternalLink, StatusBadge } from "@/components/ui";
import { AdminForm } from "@/components/admin/admin-form";
import { Checkbox, Section, TextArea, TextInput } from "@/components/admin/fields";
import { AdminLoading, Forbidden } from "@/components/admin/states";

export const metadata: Metadata = { title: "Certification" };

export default function CertEditPage(props: PageProps<"/[lang]/admin/certifications/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Editor {...props} />
    </Suspense>
  );
}

type Exam = { questions: number | null; totalPoints: number | null; passingScore: number | null; durationMinutes: number | null; nonNativeExtension: string | null };

async function Editor({ params }: PageProps<"/[lang]/admin/certifications/[id]">) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L(`/admin/certifications/${id}`));
  if (!user) return <Forbidden t={t} />;
  const db = getDb();
  const cert = /^\d+$/.test(id) ? db.select().from(s.certifications).where(eq(s.certifications.id, Number(id))).get() : undefined;
  if (!cert) notFound();
  const tr = db.select().from(s.certificationTranslations).where(eq(s.certificationTranslations.certificationId, cert.id)).all();
  const exam: Exam | null = cert.examJson ? (JSON.parse(cert.examJson) as Exam) : null;
  const isAdmin = user.roles.includes("admin");
  const canEdit = isAdmin || !cert.verified;

  return (
    <div className="mt-8 max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
        <Link href={L("/admin/certifications")} className="hover:text-pen">
          {t.admin.certifications}
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[1.8rem] font-bold tracking-[-0.02em]" lang="en">
          {cert.name} <span className="ltr font-mono text-lg text-ink-2">({cert.code})</span>
        </h1>
        {cert.verified ? <StatusBadge label={t.admin.certs.verified} tone="pass" /> : <StatusBadge label={t.admin.certs.unverified} />}
      </div>
      <p className="text-sm text-ink-2">
        <ExternalLink href={cert.sourceUrl} newTabLabel={t.common.opensInNewTab} className="text-pen underline underline-offset-2">
          {t.certs.officialPage}
        </ExternalLink>
      </p>
      {!canEdit ? (
        <p role="note" className="rounded-md border border-warn/50 bg-warn-soft px-4 py-3 text-sm text-warn">
          {t.admin.errors.forbidden}
        </p>
      ) : (
        <AdminForm action={saveCertification} locale={locale} submitLabel={t.admin.saveChanges} pendingLabel={t.common.saving}>
          <input type="hidden" name="id" value={cert.id} />
          <Section title={t.admin.certs.editCert}>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextInput name="version" label={t.admin.certs.version} defaultValue={cert.version} dir="ltr" />
              <TextInput name="sourceUrl" label={t.admin.certs.sourceUrl} defaultValue={cert.sourceUrl} type="url" dir="ltr" />
              <TextInput name="questions" label={t.admin.certs.questions} type="number" defaultValue={exam?.questions} dir="ltr" />
              <TextInput name="totalPoints" label={t.admin.certs.totalPoints} type="number" defaultValue={exam?.totalPoints} dir="ltr" />
              <TextInput name="passingScore" label={t.admin.certs.passingScore} type="number" defaultValue={exam?.passingScore} dir="ltr" />
              <TextInput name="durationMinutes" label={t.admin.certs.duration} type="number" defaultValue={exam?.durationMinutes} dir="ltr" />
              <TextInput name="nonNativeExtension" label={t.admin.certs.nonNative} defaultValue={exam?.nonNativeExtension} dir="ltr" />
              <TextInput name="reviewedOn" label={t.admin.certs.reviewedOn} type="date" defaultValue={cert.reviewedOn} dir="ltr" />
            </div>
            {isAdmin && <Checkbox name="verified" label={t.admin.certs.markVerified} defaultChecked={cert.verified} />}
          </Section>
          <Section title={t.admin.certs.summary}>
            <TextArea name="en.summary" label={`${t.admin.certs.summary} (${t.admin.english})`} defaultValue={tr.find((r) => r.locale === "en")?.summary} rows={3} dir="ltr" />
            <TextArea name="ar.summary" label={`${t.admin.certs.summary} (${t.admin.arabic})`} defaultValue={tr.find((r) => r.locale === "ar")?.summary} rows={3} dir="rtl" />
          </Section>
        </AdminForm>
      )}
    </div>
  );
}
