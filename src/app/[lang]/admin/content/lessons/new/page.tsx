import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/guard";
import { moduleOptions } from "@/lib/admin/queries";
import { levels } from "@/lib/db/schema";
import { createLesson } from "@/app/actions/admin";
import { localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { AdminForm } from "@/components/admin/admin-form";
import { Section, Select, TextArea, TextInput } from "@/components/admin/fields";
import { AdminLoading, Forbidden } from "@/components/admin/states";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/content/lessons/new">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.lessonForm.createTitle };
}

export default async function NewLessonPage({ params }: PageProps<"/[lang]/admin/content/lessons/new">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <NewLesson locale={locale} t={t} />
    </Suspense>
  );
}

async function NewLesson({ locale, t }: { locale: Locale; t: Dictionary }) {
  const user = await requireStaffPage(localePath(locale, "/admin/content/lessons/new"));
  if (!user) return <Forbidden t={t} />;
  return (
    <div className="mt-8 max-w-3xl">
      <h1 className="text-[1.8rem] font-bold tracking-[-0.02em]">{t.admin.lessonForm.createTitle}</h1>
      <div className="mt-6">
        <AdminForm action={createLesson} locale={locale} submitLabel={t.admin.newLesson} pendingLabel={t.common.saving}>
          <Section title={t.admin.workflow}>
            <Select name="moduleId" label={t.admin.module} options={[{ value: "", label: t.admin.lessonForm.chooseModule }, ...moduleOptions(locale)]} />
            <div className="grid gap-5 sm:grid-cols-3">
              <TextInput name="slug" label={t.admin.slug} hint={t.admin.slugHint} dir="ltr" />
              <TextInput name="minutes" label={t.admin.minutes} type="number" defaultValue={20} dir="ltr" />
              <Select name="level" label={t.admin.level} options={levels.map((l) => ({ value: l, label: t.levels[l] }))} />
            </div>
          </Section>
          <Section title={t.admin.english} lang="en" dir="ltr">
            <TextInput name="en.title" label={t.admin.titleField} dir="ltr" />
            <TextArea name="en.summary" label={t.admin.summaryField} rows={3} dir="ltr" />
          </Section>
        </AdminForm>
      </div>
    </div>
  );
}
