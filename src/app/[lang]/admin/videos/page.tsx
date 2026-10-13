import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { addVideo } from "@/app/actions/admin";
import { formatIsoDate, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { StatusBadge } from "@/components/ui";
import { AdminForm } from "@/components/admin/admin-form";
import { Section, TextInput } from "@/components/admin/fields";
import { VideoFields } from "@/components/admin/video-fields";
import { AdminLoading, Forbidden, statusTone } from "@/components/admin/states";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/videos">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.videosNav };
}

export default async function AdminVideosPage({ params }: PageProps<"/[lang]/admin/videos">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <Videos locale={locale} t={t} />
    </Suspense>
  );
}

async function Videos({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L("/admin/videos"));
  if (!user) return <Forbidden t={t} />;
  const videos = getDb().select().from(s.videos).orderBy(desc(s.videos.id)).all();
  return (
    <div className="mt-8 space-y-8">
      <div>
        <h1 className="text-[2rem] font-bold tracking-[-0.02em]">{t.admin.videosNav}</h1>
        <p className="mt-2 max-w-[70ch] text-ink-2">{t.admin.videos.lead}</p>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-ink-3">
              <th scope="col" className="px-5 py-2 text-start font-medium">{t.admin.colTitle}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.videos.creatorCol}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colStatus}</th>
              <th scope="col" className="px-3 py-2 text-start font-medium">{t.library.videoVerified.replace("{date}", "").trim()}</th>
              <th scope="col" className="px-5 py-2 text-end font-medium">{t.admin.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0">
                <td className="px-5 py-2.5" lang={v.language} dir="auto">
                  {v.title}
                </td>
                <td className="px-3 py-2.5 text-ink-2" dir="auto">
                  {v.creator}
                </td>
                <td className="px-3 py-2.5">
                  <StatusBadge label={t.statuses[v.status]} tone={statusTone(v.status)} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{v.verifiedOn ? formatIsoDate(locale, v.verifiedOn) : "–"}</td>
                <td className="px-5 py-2.5 text-end">
                  <Link href={L(`/admin/videos/${v.id}`)} className="font-semibold text-pen underline underline-offset-2">
                    {t.admin.videos.editVideo}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminForm action={addVideo} locale={locale} submitLabel={t.admin.videos.add} pendingLabel={t.common.saving}>
        <Section title={t.admin.videos.add}>
          <TextInput name="url" label={t.admin.videos.url} dir="ltr" />
          <VideoFields t={t} />
        </Section>
      </AdminForm>
    </div>
  );
}
