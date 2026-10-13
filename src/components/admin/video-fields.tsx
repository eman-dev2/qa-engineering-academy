import { levels } from "@/lib/db/schema";
import { skillIds } from "@/content/skills";
import type { Dictionary } from "@/i18n";
import { Checkbox, Checkboxes, Select, TextArea, TextInput } from "./fields";

export type VideoDefaults = {
  title?: string;
  creator?: string;
  creatorUrl?: string;
  language?: string;
  level?: string;
  skills?: string[];
  relatedLessons?: string[];
  descEn?: string;
  descAr?: string;
};

export function VideoFields({ t, v = {} }: { t: Dictionary; v?: VideoDefaults }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput name="title" label={t.admin.videos.titleOriginal} defaultValue={v.title} dir="auto" className="sm:col-span-2" />
        <TextInput name="creator" label={t.admin.videos.creator} defaultValue={v.creator} dir="auto" />
        <TextInput name="creatorUrl" label={t.admin.videos.creatorUrl} defaultValue={v.creatorUrl} type="url" dir="ltr" />
        <TextInput name="language" label={t.admin.videos.language} defaultValue={v.language ?? "en"} dir="ltr" />
        <Select name="level" label={t.admin.level} defaultValue={v.level} options={levels.map((l) => ({ value: l, label: t.levels[l] }))} />
      </div>
      <TextArea name="en.description" label={t.admin.videos.descriptionEn} defaultValue={v.descEn} rows={3} dir="ltr" />
      <TextArea name="ar.description" label={t.admin.videos.descriptionAr} defaultValue={v.descAr} rows={3} dir="rtl" />
      <TextArea name="relatedLessons" label={t.admin.videos.relatedLessons} defaultValue={(v.relatedLessons ?? []).join("\n")} rows={3} dir="ltr" mono />
      <Checkboxes name="skills" legend={t.admin.skills} options={skillIds.map((sk) => ({ value: sk, label: t.skills[sk] }))} checked={v.skills ?? []} />
      <Checkbox name="verifiedToday" label={t.admin.videos.verifiedToday} />
    </>
  );
}
