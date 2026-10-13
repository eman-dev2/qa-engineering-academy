import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { pathForEdit } from "@/lib/admin/queries";
import { formatLines } from "@/lib/admin/parse";
import { contentStatuses, levels } from "@/lib/db/schema";
import { skillIds } from "@/content/skills";
import { addModule, savePath } from "@/app/actions/admin";
import { localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { StatusBadge } from "@/components/ui";
import { AdminForm } from "@/components/admin/admin-form";
import { Checkboxes, Section, Select, TextArea, TextInput } from "@/components/admin/fields";
import { AdminLoading, Forbidden, statusTone } from "@/components/admin/states";

export const metadata: Metadata = { title: "Path" };

export default function PathEditPage(props: PageProps<"/[lang]/admin/content/paths/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Editor {...props} />
    </Suspense>
  );
}

type PathText = { title: string; summary: string; goal: string; prerequisitesJson: string; outcomesJson: string; milestonesJson: string } | null;

function PathTextFields({ loc, row, t }: { loc: "en" | "ar"; row: PathText; t: Dictionary }) {
  const p = `${loc}.`;
  const dir = loc === "ar" ? "rtl" : "ltr";
  const lines = (json?: string) => (json ? formatLines(JSON.parse(json) as string[]) : "");
  return (
    <>
      <TextInput name={p + "title"} label={t.admin.titleField} defaultValue={row?.title} dir={dir} />
      <TextArea name={p + "summary"} label={t.admin.summaryField} defaultValue={row?.summary} rows={2} dir={dir} />
      <TextArea name={p + "goal"} label={t.admin.goalField} defaultValue={row?.goal} rows={2} dir={dir} />
      <TextArea name={p + "prerequisites"} label={t.admin.prerequisitesField} defaultValue={lines(row?.prerequisitesJson)} rows={3} dir={dir} />
      <TextArea name={p + "outcomes"} label={t.admin.outcomesField} defaultValue={lines(row?.outcomesJson)} rows={4} dir={dir} />
      <TextArea name={p + "milestones"} label={t.admin.milestonesField} defaultValue={lines(row?.milestonesJson)} rows={3} dir={dir} />
    </>
  );
}

async function Editor({ params }: PageProps<"/[lang]/admin/content/paths/[id]">) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L(`/admin/content/paths/${id}`));
  if (!user) return <Forbidden t={t} />;
  const data = /^\d+$/.test(id) ? pathForEdit(Number(id)) : null;
  if (!data) notFound();
  const { path, en, ar, modules } = data;
  const isAdmin = user.roles.includes("admin");
  const slugLocked = !!getDb().select({ id: s.lessons.id }).from(s.lessons).where(and(eq(s.lessons.pathId, path.id), isNotNull(s.lessons.publishedAt))).get();
  const canEdit = path.status !== "published" || isAdmin;
  const statusOptions = contentStatuses
    .filter((st) => isAdmin || path.status === st || !["published", "archived"].includes(st))
    .map((st) => ({ value: st, label: t.statuses[st] }));

  return (
    <div className="mt-8 space-y-8">
      <div>
        <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
          <Link href={L("/admin/content")} className="hover:text-pen">
            {t.admin.content}
          </Link>
        </nav>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-[1.8rem] font-bold tracking-[-0.02em]">{t.admin.pathForm.editTitle}</h1>
          <StatusBadge label={t.statuses[path.status]} tone={statusTone(path.status)} />
        </div>
        <p className="mt-2 max-w-[70ch] text-sm text-ink-2">{t.admin.pathForm.pathStatusNote}</p>
      </div>

      {canEdit ? (
        <AdminForm action={savePath} locale={locale} submitLabel={t.admin.saveChanges} pendingLabel={t.common.saving}>
          <input type="hidden" name="id" value={path.id} />
          <Section title={t.admin.workflow}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <TextInput name="slug" label={t.admin.slug} hint={slugLocked ? t.admin.slugLocked : t.admin.slugHint} defaultValue={path.slug} readOnly={slugLocked} dir="ltr" />
              <Select name="status" label={t.admin.colStatus} defaultValue={path.status} options={statusOptions} />
              <TextInput name="position" label={t.admin.position} type="number" defaultValue={path.position} dir="ltr" />
              <Select name="startsAt" label={t.admin.startsAt} defaultValue={path.startsAt} options={levels.map((l) => ({ value: l, label: t.levels[l] }))} />
              <Select name="leadsTo" label={t.admin.leadsTo} defaultValue={path.leadsTo} options={levels.map((l) => ({ value: l, label: t.levels[l] }))} />
            </div>
            <Checkboxes name="skills" legend={t.admin.skills} options={skillIds.map((sk) => ({ value: sk, label: t.skills[sk] }))} checked={JSON.parse(path.skillsJson) as string[]} />
          </Section>
          <Section title={t.admin.english} lang="en" dir="ltr">
            <PathTextFields loc="en" row={en} t={t} />
          </Section>
          <Section title={t.admin.arabic} lang="ar" dir="rtl">
            <PathTextFields loc="ar" row={ar} t={t} />
          </Section>
          <Section title={t.admin.pathForm.modules}>
            {modules.map((m) => (
              <fieldset key={m.id} className="rounded-md border border-line p-4">
                <legend className="ltr px-1 font-mono text-sm text-ink-2">{m.slug}</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput name={`module.${m.id}.en.title`} label={t.admin.pathForm.moduleTitleEn} defaultValue={m.en?.title} dir="ltr" />
                  <TextInput name={`module.${m.id}.ar.title`} label={t.admin.pathForm.moduleTitleAr} defaultValue={m.ar?.title} dir="rtl" />
                  <TextArea name={`module.${m.id}.en.summary`} label={t.admin.pathForm.moduleSummaryEn} defaultValue={m.en?.summary} rows={2} dir="ltr" />
                  <TextArea name={`module.${m.id}.ar.summary`} label={t.admin.pathForm.moduleSummaryAr} defaultValue={m.ar?.summary} rows={2} dir="rtl" />
                  <TextInput name={`module.${m.id}.position`} label={t.admin.position} type="number" defaultValue={m.position} dir="ltr" />
                </div>
              </fieldset>
            ))}
          </Section>
        </AdminForm>
      ) : (
        <p role="note" className="rounded-md border border-warn/50 bg-warn-soft px-4 py-3 text-sm text-warn">
          {t.admin.errors.onlyAdminPublish}
        </p>
      )}

      {canEdit && (
        <AdminForm action={addModule} locale={locale} submitLabel={t.admin.pathForm.addModule} pendingLabel={t.common.saving}>
          <input type="hidden" name="pathId" value={path.id} />
          <Section title={t.admin.pathForm.addModule}>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput name="slug" label={t.admin.pathForm.moduleSlug} hint={t.admin.slugHint} dir="ltr" />
              <span aria-hidden />
              <TextInput name="en.title" label={t.admin.pathForm.moduleTitleEn} dir="ltr" />
              <TextInput name="ar.title" label={t.admin.pathForm.moduleTitleAr} dir="rtl" />
              <TextArea name="en.summary" label={t.admin.pathForm.moduleSummaryEn} rows={2} dir="ltr" />
              <TextArea name="ar.summary" label={t.admin.pathForm.moduleSummaryAr} rows={2} dir="rtl" />
            </div>
          </Section>
        </AdminForm>
      )}
    </div>
  );
}
