import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { requireStaffPage } from "@/lib/admin/guard";
import { saveVideo } from "@/app/actions/admin";
import { format, localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { ExternalLink, StatusBadge } from "@/components/ui";
import { AdminForm } from "@/components/admin/admin-form";
import { Section, Select } from "@/components/admin/fields";
import { VideoFields } from "@/components/admin/video-fields";
import { AdminLoading, Forbidden, statusTone } from "@/components/admin/states";
import { VideoEmbed } from "@/components/video-embed";

export const metadata: Metadata = { title: "Video" };

export default function VideoEditPage(props: PageProps<"/[lang]/admin/videos/[id]">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Editor {...props} />
    </Suspense>
  );
}

async function Editor({ params, searchParams }: PageProps<"/[lang]/admin/videos/[id]">) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L(`/admin/videos/${id}`));
  if (!user) return <Forbidden t={t} />;
  const db = getDb();
  const video = /^\d+$/.test(id) ? db.select().from(s.videos).where(eq(s.videos.id, Number(id))).get() : undefined;
  if (!video) notFound();
  const tr = db.select().from(s.videoTranslations).where(eq(s.videoTranslations.videoId, video.id)).all();
  const isAdmin = user.roles.includes("admin");
  const canEdit = isAdmin || video.status !== "published";
  const created = (await searchParams).created === "1";
  const statusOptions = (["draft", "published", "archived"] as const)
    .filter((st) => isAdmin || st === video.status || st === "draft")
    .map((st) => ({ value: st, label: t.statuses[st] }));

  return (
    <div className="mt-8 max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-3">
        <Link href={L("/admin/videos")} className="hover:text-pen">
          {t.admin.videosNav}
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[1.6rem] font-bold tracking-[-0.02em]" dir="auto">
          {video.title}
        </h1>
        <StatusBadge label={t.statuses[video.status]} tone={statusTone(video.status)} />
      </div>
      {created && (
        <p role="status" className="rounded-md border border-pass/50 bg-pass-soft px-4 py-3 text-sm text-pass">
          {t.admin.videos.added}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <div>
          <VideoEmbed youtubeId={video.youtubeId} title={video.title} playLabel={format(t.library.play, { title: video.title })} notice={t.library.embedNotice} />
          <ExternalLink
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}`}
            newTabLabel={t.common.opensInNewTab}
            className="mt-2 inline-block text-sm font-semibold text-pen underline underline-offset-2"
          >
            {t.library.watch}
          </ExternalLink>
        </div>
        {canEdit ? (
          <AdminForm action={saveVideo} locale={locale} submitLabel={t.admin.saveChanges} pendingLabel={t.common.saving}>
            <input type="hidden" name="id" value={video.id} />
            <Section title={t.admin.videos.editVideo}>
              <Select name="status" label={t.admin.colStatus} defaultValue={video.status} options={statusOptions} />
              <VideoFields
                t={t}
                v={{
                  title: video.title,
                  creator: video.creator,
                  creatorUrl: video.creatorUrl,
                  language: video.language,
                  level: video.level,
                  skills: JSON.parse(video.skillsJson) as string[],
                  relatedLessons: JSON.parse(video.relatedLessonsJson) as string[],
                  descEn: tr.find((r) => r.locale === "en")?.description,
                  descAr: tr.find((r) => r.locale === "ar")?.description,
                }}
              />
            </Section>
          </AdminForm>
        ) : (
          <p role="note" className="rounded-md border border-warn/50 bg-warn-soft px-4 py-3 text-sm text-warn">
            {t.admin.errors.onlyAdminPublish}
          </p>
        )}
      </div>
    </div>
  );
}
