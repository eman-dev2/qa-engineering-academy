import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/guard";
import { lessonForEdit, moduleOptions } from "@/lib/admin/queries";
import { availableActions } from "@/lib/admin/workflow";
import { publishProblems, toLessonText, type StoredLessonText } from "@/lib/admin/lesson-checks";
import { formatLines, formatPairs, formatReferences } from "@/lib/admin/parse";
import { levels } from "@/lib/db/schema";
import { skillIds } from "@/content/skills";
import { changeLessonStatus, saveLesson } from "@/app/actions/admin";
import { format, localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { StatusBadge, buttonClass } from "@/components/ui";
import { AdminForm } from "@/components/admin/admin-form";
import { Checkboxes, Section, Select, TextArea, TextInput } from "@/components/admin/fields";
import { AdminLoading, Forbidden, statusTone } from "@/components/admin/states";

export const metadata: Metadata = { title: "Lesson" };

export default function LessonEditPage(props: PageProps<"/[lang]/admin/content/lessons/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Editor {...props} />
    </Suspense>
  );
}

function TextFields({ loc, row, t }: { loc: "en" | "ar"; row: StoredLessonText | null; t: Dictionary }) {
  const v = row ? toLessonText(row) : null;
  const ex = v?.exercise as { title?: string; brief?: string; modelAnswer?: string } | null;
  const p = `${loc}.`;
  const dir = loc === "ar" ? "rtl" : "ltr";
  return (
    <>
      <TextInput name={p + "title"} label={t.admin.titleField} defaultValue={v?.title} dir={dir} />
      <TextArea name={p + "summary"} label={t.admin.summaryField} defaultValue={v?.summary} rows={2} dir={dir} />
      <TextArea name={p + "objectives"} label={t.admin.objectivesField} defaultValue={v ? formatLines(v.objectives) : ""} rows={4} dir={dir} />
      <TextArea name={p + "prerequisites"} label={t.admin.prerequisitesField} defaultValue={v ? formatLines(v.prerequisites) : ""} rows={3} dir={dir} />
      <TextArea name={p + "body"} label={t.admin.bodyField} defaultValue={row?.body} rows={18} dir={dir} mono />
      <TextArea
        name={p + "keyTerms"}
        label={t.admin.keyTermsField}
        defaultValue={v ? formatPairs((v.keyTerms as { term: string; definition: string }[]).map((k) => [k.term, k.definition])) : ""}
        rows={4}
        dir={dir}
      />
      <TextArea
        name={p + "mistakes"}
        label={t.admin.mistakesField}
        defaultValue={v ? formatPairs((v.mistakes as { mistake: string; fix: string }[]).map((m) => [m.mistake, m.fix])) : ""}
        rows={4}
        dir={dir}
      />
      <TextInput name={p + "exerciseTitle"} label={t.admin.exerciseTitleField} defaultValue={ex?.title} dir={dir} />
      <TextArea name={p + "exerciseBrief"} label={t.admin.exerciseBriefField} defaultValue={ex?.brief} rows={8} dir={dir} mono />
      <TextArea name={p + "exerciseAnswer"} label={t.admin.exerciseAnswerField} defaultValue={ex?.modelAnswer} rows={8} dir={dir} mono />
      <TextArea
        name={p + "quiz"}
        label={t.admin.quizField}
        hint={t.admin.quizHint}
        defaultValue={v && v.quiz.length ? JSON.stringify(v.quiz, null, 2) : ""}
        rows={14}
        dir="ltr"
        mono
      />
      <TextArea
        name={p + "references"}
        label={t.admin.referencesField}
        defaultValue={v ? formatReferences(v.references as { title: string; url: string; publisher: string }[]) : ""}
        rows={3}
        dir="ltr"
      />
    </>
  );
}

async function Editor({ params, searchParams }: PageProps<"/[lang]/admin/content/lessons/[id]">) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L(`/admin/content/lessons/${id}`));
  if (!user) return <Forbidden t={t} />;
  const data = /^\d+$/.test(id) ? lessonForEdit(Number(id)) : null;
  if (!data) notFound();
  const { lesson, path, en, ar } = data;
  const created = (await searchParams).created === "1";
  const actions = availableActions(lesson.status, user.roles);
  const problems = lesson.status !== "published" ? publishProblems(lesson, en, ar) : [];
  const errorText = t.admin.errors as Record<string, string>;
  const canEdit = lesson.status !== "published" || user.roles.includes("admin");

  return (
    <div className="mt-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
        <Link href={L("/admin/content")} className="hover:text-pen">
          {t.admin.content}
        </Link>
        {" / "}
        <span className="ltr">{path.slug}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-[1.8rem] font-bold tracking-[-0.02em]">{(locale === "ar" ? ar?.title : null) ?? en?.title ?? lesson.slug}</h1>
        <StatusBadge label={t.statuses[lesson.status]} tone={statusTone(lesson.status)} />
      </div>
      {created && (
        <p role="status" className="mt-4 rounded-md border border-pass/50 bg-pass-soft px-4 py-3 text-sm text-pass">
          {t.admin.created}
        </p>
      )}

      <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          {canEdit ? (
            <AdminForm action={saveLesson} locale={locale} submitLabel={t.admin.saveChanges} pendingLabel={t.common.saving}>
              <input type="hidden" name="id" value={lesson.id} />
              <Section title={t.admin.workflow}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput
                    name="slug"
                    label={t.admin.slug}
                    hint={lesson.publishedAt ? t.admin.slugLocked : t.admin.slugHint}
                    defaultValue={lesson.slug}
                    readOnly={!!lesson.publishedAt}
                    dir="ltr"
                  />
                  <Select name="moduleId" label={t.admin.module} defaultValue={lesson.moduleId} options={moduleOptions(locale, lesson.pathId)} />
                  <TextInput name="position" label={t.admin.position} type="number" defaultValue={lesson.position} dir="ltr" />
                  <TextInput name="minutes" label={t.admin.minutes} type="number" defaultValue={lesson.minutes} dir="ltr" />
                  <Select name="level" label={t.admin.level} defaultValue={lesson.level} options={levels.map((l) => ({ value: l, label: t.levels[l] }))} />
                  <TextInput name="reviewedOn" label={t.admin.reviewedOn} type="date" defaultValue={lesson.reviewedOn} dir="ltr" />
                </div>
                <Checkboxes
                  name="skills"
                  legend={t.admin.skills}
                  options={skillIds.map((sk) => ({ value: sk, label: t.skills[sk] }))}
                  checked={JSON.parse(lesson.skillsJson) as string[]}
                />
              </Section>
              <Section title={t.admin.english} lang="en" dir="ltr">
                <TextFields loc="en" row={en} t={t} />
              </Section>
              <Section title={t.admin.arabic} lang="ar" dir="rtl">
                <p className="text-sm text-ink-3">{t.admin.arabicOptional}</p>
                <TextFields loc="ar" row={ar} t={t} />
              </Section>
            </AdminForm>
          ) : (
            <p role="note" className="rounded-md border border-warn/50 bg-warn-soft px-4 py-3 text-sm text-warn">
              {t.admin.errors.onlyAdminPublish}
            </p>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-lg border border-line-strong bg-surface p-5">
            <h2 className="font-bold">{t.admin.workflow}</h2>
            <p className="mt-1 text-sm text-ink-2">{format(t.admin.workflowLead, { status: t.statuses[lesson.status] })}</p>
            {problems.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 ps-5 text-sm text-warn">
                {problems.map((p) => (
                  <li key={p}>{errorText[p] ?? p}</li>
                ))}
              </ul>
            )}
            {/* Always mounted, so the result message survives the status change re-render. */}
            <AdminForm
                action={changeLessonStatus}
                locale={locale}
                pendingLabel={t.common.saving}
                className="mt-4 space-y-3"
                secondary={actions.length === 0 ? undefined : actions.map((a) => (
                  <button
                    key={a}
                    type="submit"
                    name="intent"
                    value={a}
                    className={buttonClass(a === "publish" ? "primary" : a === "archive" ? "danger" : "secondary", "w-full")}
                  >
                    {t.admin.actions[a]}
                  </button>
                ))}
              >
                <input type="hidden" name="id" value={lesson.id} />
              </AdminForm>
          </div>
          {lesson.status === "published" && (
            <Link href={L(`/paths/${path.slug}/${lesson.slug}`)} className={buttonClass("secondary", "w-full")}>
              {t.admin.view}
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
