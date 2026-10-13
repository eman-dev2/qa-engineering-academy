import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import { CONTENT_CACHE, CONTENT_TAG, getCertifications, getPaths, parseJson } from "@/lib/content/repo";
import { extractHeadings } from "@/lib/content/headings";
import type { KeyTerm } from "@/lib/content/schema";
import { format, localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import type { SearchDoc } from "./search";

/** Every searchable document in one language (lessons fall back to English when untranslated). */
export async function getSearchDocs(locale: Locale): Promise<SearchDoc[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  const t = getDictionary(locale);
  const L = (p: string) => localePath(locale, p);
  const [paths, certs] = await Promise.all([getPaths(locale), getCertifications(locale)]);
  const lessonIds = paths.flatMap((p) => p.lessons.map((l) => l.id));
  const rows = lessonIds.length
    ? getDb()
        .select({ lessonId: s.lessonTranslations.lessonId, locale: s.lessonTranslations.locale, body: s.lessonTranslations.body, keyTermsJson: s.lessonTranslations.keyTermsJson })
        .from(s.lessonTranslations)
        .where(inArray(s.lessonTranslations.lessonId, lessonIds))
        .all()
    : [];
  const textFor = (id: number) => rows.find((r) => r.lessonId === id && r.locale === locale) ?? rows.find((r) => r.lessonId === id && r.locale === "en");

  const docs: SearchDoc[] = [];
  for (const p of paths) {
    docs.push({
      id: `path:${p.slug}`,
      kind: "path",
      title: p.title,
      summary: p.summary,
      href: L(`/paths/${p.slug}`),
      context: format(t.search.pathContext, { from: t.levels[p.startsAt], to: t.levels[p.leadsTo] }),
      fields: [
        { text: p.title, weight: 6 },
        { text: [p.goal, ...p.outcomes, ...p.modules.map((m) => m.title)].join(" "), weight: 2 },
        { text: p.summary, weight: 1 },
      ],
    });
    for (const l of p.lessons) {
      const row = textFor(l.id);
      const body = row?.body ?? "";
      const terms = parseJson<KeyTerm[]>(row?.keyTermsJson, []);
      docs.push({
        id: `lesson:${l.key}`,
        kind: "lesson",
        title: l.title,
        summary: l.summary,
        href: L(`/paths/${p.slug}/${l.slug}`),
        context: format(t.search.lessonContext, { n: l.position ?? 1, path: p.title }),
        fields: [
          { text: l.title, weight: 6 },
          { text: [...extractHeadings(body).map((h) => h.text), ...terms.map((k) => k.term)].join(" "), weight: 3 },
          { text: [l.summary, ...l.objectives].join(" "), weight: 2 },
          { text: body, weight: 1 },
        ],
      });
    }
  }
  for (const c of certs) {
    const stream = t.certs.streams[c.stream] ?? c.stream;
    docs.push({
      id: `cert:${c.slug}`,
      kind: "certification",
      title: `${c.name} (${c.code})`,
      summary: c.summary ?? stream,
      href: c.verified ? L(`/certifications/${c.slug}`) : `${L("/certifications")}?stream=${encodeURIComponent(c.stream)}`,
      context: format(t.search.certContext, { issuer: c.issuer, stream }),
      fields: [
        { text: `${c.name} ${c.code}`, weight: 6 },
        { text: [...c.chapters, ...(c.chaptersTranslated ?? [])].join(" "), weight: 2 },
        { text: c.summary ?? stream, weight: 1 },
      ],
    });
  }
  return docs;
}
