import { describe, expect, it } from "vitest";
import { loadLessonFiles, MIN_BODY_WORDS, wordCount } from "../../seed/lib";
import { seedPaths } from "../../seed/content/paths";
import { seedCertifications } from "../../seed/content/certifications";
import { seedVideos } from "../../seed/content/videos";
import { seedProjects, seedTemplates } from "../../seed/content/library";
import { extractHeadings } from "@/lib/content/headings";
import { quizKeysMatch, quizQuestionSchema } from "@/lib/content/schema";
import { site } from "@/content/site";
import fs from "node:fs";
import path from "node:path";

const published = seedPaths.flatMap((p) => p.modules.flatMap((m) => m.lessons.filter((l) => l.published).map((l) => ({ path: p.slug, slug: l.slug }))));
const loaded = published.map((ref) => ({ ...ref, key: `${ref.path}/${ref.slug}`, lesson: loadLessonFiles(ref.path, ref.slug) }));

describe("published lessons (seed files)", () => {
  it("has at least 14 published lessons, every one with English and Arabic text", () => {
    expect(loaded.length).toBeGreaterThanOrEqual(14);
    for (const l of loaded) expect(l.lesson.ar, `${l.key} is missing its .ar.md file`).not.toBeNull();
  });

  it("gives each lesson, in each language, the parts the brief requires", () => {
    for (const l of loaded) {
      for (const [lang, text] of [["en", l.lesson.en], ["ar", l.lesson.ar!]] as const) {
        const label = `${l.key} (${lang})`;
        expect(text.objectives.length, label).toBeGreaterThanOrEqual(2);
        expect(text.mistakes.length, label).toBeGreaterThanOrEqual(2);
        expect(text.quiz.length, label).toBeGreaterThanOrEqual(3);
        expect(text.references.length, label).toBeGreaterThanOrEqual(1);
        expect(extractHeadings(text.body).length, label).toBeGreaterThanOrEqual(3);
        expect(wordCount(text.body), `${label} body length`).toBeGreaterThanOrEqual(MIN_BODY_WORDS);
      }
    }
  });

  it("keeps Arabic knowledge checks scoreable with the same ids and answers as English", () => {
    for (const l of loaded) expect(quizKeysMatch(l.lesson.en.quiz, l.lesson.ar!.quiz), l.key).toBe(true);
  });

  it("keeps the same references in both languages", () => {
    for (const l of loaded) {
      expect(l.lesson.ar!.references.map((r) => r.url), l.key).toEqual(l.lesson.en.references.map((r) => r.url));
    }
  });

  it("has unique heading anchors within each lesson", () => {
    for (const l of loaded) {
      for (const text of [l.lesson.en, l.lesson.ar!]) {
        const ids = extractHeadings(text.body).map((h) => h.id);
        expect(new Set(ids).size, l.key).toBe(ids.length);
      }
    }
  });

  it("uses https for every reference and contains no placeholder text", () => {
    for (const l of loaded) {
      for (const text of [l.lesson.en, l.lesson.ar!]) {
        for (const r of text.references) expect(r.url.startsWith("https://"), r.url).toBe(true);
        expect(text.body).not.toMatch(/lorem ipsum|\bTODO\b|\bTBD\b/i);
      }
    }
  });

  it("has a review date on every published lesson", () => {
    for (const l of loaded) expect(l.lesson.shared.reviewedOn, l.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("learning paths (seed data)", () => {
  it("covers the career levels the brief asks for", () => {
    const levels = new Set(seedPaths.flatMap((p) => [p.startsAt, p.leadsTo]));
    for (const level of ["Beginner", "Junior", "Mid-level", "Senior", "Automation", "Lead", "Manager"] as const) {
      expect(levels.has(level) || seedPaths.some((p) => p.startsAt === level), level).toBe(true);
    }
  });

  it("has unique path, module and lesson slugs", () => {
    const pathSlugs = seedPaths.map((p) => p.slug);
    expect(new Set(pathSlugs).size).toBe(pathSlugs.length);
    for (const p of seedPaths) {
      const lessonSlugs = p.modules.flatMap((m) => m.lessons.map((l) => l.slug));
      expect(new Set(lessonSlugs).size, p.slug).toBe(lessonSlugs.length);
      const moduleSlugs = p.modules.map((m) => m.slug);
      expect(new Set(moduleSlugs).size, p.slug).toBe(moduleSlugs.length);
    }
  });

  it("writes every path, module and planned outline in both languages", () => {
    for (const p of seedPaths) {
      expect(p.text.en.title && p.text.ar.title, p.slug).toBeTruthy();
      expect(p.text.ar.outcomes.length, p.slug).toBe(p.text.en.outcomes.length);
      for (const m of p.modules) {
        expect(m.text.en.title && m.text.ar.title, `${p.slug}/${m.slug}`).toBeTruthy();
        for (const l of m.lessons) {
          if (!l.published) expect(l.outline.en.title && l.outline.ar.title, `${p.slug}/${l.slug}`).toBeTruthy();
        }
      }
    }
  });
});

describe("certifications (seed data)", () => {
  it("has unique slugs", () => {
    const slugs = seedCertifications.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("only marks a certification verified when facts, source and review date are present", () => {
    for (const c of seedCertifications.filter((x) => x.verified)) {
      expect(c.sourceUrl, c.code).toMatch(/^https:\/\/istqb\.org\//);
      expect(c.reviewedOn, c.code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.exam?.questions, c.code).toBeGreaterThan(0);
      expect(c.exam?.passingScore, c.code).toBeGreaterThan(0);
      expect(c.exam!.passingScore!, c.code).toBeLessThanOrEqual(c.exam!.totalPoints!);
      expect(c.text.ar.summary, `${c.code} Arabic summary`).toBeTruthy();
    }
  });

  it("never stores exam facts for unverified certifications", () => {
    for (const c of seedCertifications.filter((x) => !x.verified)) {
      expect(c.exam, c.code).toBeNull();
      expect(c.reviewedOn ?? null, c.code).toBeNull();
    }
  });

  it("has valid original practice questions with matching Arabic answer keys", () => {
    const ctfl = seedCertifications.find((c) => c.slug === "ctfl")!;
    const en = ctfl.text.en.practice!;
    const ar = ctfl.text.ar.practice!;
    expect(en.length).toBe(10);
    for (const q of en) expect(quizQuestionSchema.safeParse(q).success, q.id).toBe(true);
    expect(quizKeysMatch(en, ar)).toBe(true);
  });
});

describe("library (seed data)", () => {
  it("only links videos by YouTube id, with attribution and a verification date", () => {
    for (const v of seedVideos) {
      expect(v.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(v.creator.length).toBeGreaterThan(1);
      expect(v.creatorUrl).toMatch(/^https:\/\//);
      expect(v.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("ships a real file for every template in both languages", () => {
    for (const t of seedTemplates) {
      for (const locale of ["en", "ar"] as const) {
        const file = path.join(process.cwd(), "public", "templates", locale, t.file);
        expect(fs.existsSync(file), file).toBe(true);
        expect(fs.statSync(file).size, file).toBeGreaterThan(100);
      }
    }
  });

  it("writes every practice project in both languages", () => {
    for (const p of seedProjects) {
      expect(p.text.en.brief.length, p.slug).toBeGreaterThan(200);
      expect(p.text.ar.brief.length, p.slug).toBeGreaterThan(200);
      expect(p.text.ar.criteria.length, p.slug).toBe(p.text.en.criteria.length);
    }
  });
});

describe("site settings", () => {
  it("keeps the owner's LinkedIn URL in one place", () => {
    expect(site.owner.name).toBe("Eman Abo-Oun");
    expect(site.owner.linkedinUrl).toBe("https://www.linkedin.com/in/eman-abo-oun-28ba40207/");
  });
});
