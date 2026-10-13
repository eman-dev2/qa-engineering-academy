import { describe, expect, it } from "vitest";
import { formatPairs, formatReferences, parseLines, parsePairs, parseReferences, parseYouTubeId, slugPattern } from "@/lib/admin/parse";
import { availableActions, nextStatus, requiresAdmin } from "@/lib/admin/workflow";
import { publishProblems, type StoredLessonText } from "@/lib/admin/lesson-checks";
import { loadLessonFiles, lessonTranslationValues } from "../../seed/lib";

describe("admin text formats", () => {
  it("parses one item per line, ignoring blank lines and whitespace", () => {
    expect(parseLines("  first \n\n second\r\nthird  ")).toEqual(["first", "second", "third"]);
  });

  it("parses 'left :: right' pairs and reports the first bad line", () => {
    expect(parsePairs("SUT :: System under test\n\nBVA :: Boundary value analysis")).toEqual({
      ok: true,
      value: [
        ["SUT", "System under test"],
        ["BVA", "Boundary value analysis"],
      ],
    });
    expect(parsePairs("Good :: pair\nno separator here")).toEqual({ ok: false, line: 2 });
    expect(parsePairs(":: missing left")).toEqual({ ok: false, line: 1 });
  });

  it("round-trips pairs and references", () => {
    const pairs: [string, string][] = [["a", "b :: c"]];
    const parsed = parsePairs(formatPairs(pairs));
    expect(parsed.ok && parsed.value).toEqual([["a", "b :: c"]]);
    const refs = [{ title: "RFC 9110", url: "https://www.rfc-editor.org/rfc/rfc9110", publisher: "IETF" }];
    const back = parseReferences(formatReferences(refs));
    expect(back.ok && back.value).toEqual(refs);
  });

  it("only accepts https references with three parts", () => {
    expect(parseReferences("Title | http://insecure.example | Pub")).toEqual({ ok: false, line: 1 });
    expect(parseReferences("Title | https://ok.example")).toEqual({ ok: false, line: 1 });
  });

  it("extracts YouTube ids from links and rejects everything else", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=SLhz2KmBh2Q")).toBe("SLhz2KmBh2Q");
    expect(parseYouTubeId("https://youtu.be/SLhz2KmBh2Q?t=10")).toBe("SLhz2KmBh2Q");
    expect(parseYouTubeId("https://www.youtube.com/embed/SLhz2KmBh2Q")).toBe("SLhz2KmBh2Q");
    expect(parseYouTubeId("https://www.youtube.com/shorts/SLhz2KmBh2Q")).toBe("SLhz2KmBh2Q");
    expect(parseYouTubeId("SLhz2KmBh2Q")).toBe("SLhz2KmBh2Q");
    expect(parseYouTubeId("https://vimeo.com/123456")).toBeNull();
    expect(parseYouTubeId("https://evil.example/watch?v=SLhz2KmBh2Q")).toBeNull();
    expect(parseYouTubeId("not a link")).toBeNull();
  });

  it("accepts lowercase hyphenated slugs only", () => {
    expect(slugPattern.test("api-testing-essentials")).toBe(true);
    for (const bad of ["Api", "api_testing", "-api", "api-", "api--x", "", "مسار"]) expect(slugPattern.test(bad), bad).toBe(false);
  });
});

describe("editorial workflow", () => {
  it("moves lessons through draft, review, published and archived", () => {
    expect(nextStatus("submit", "draft")).toBe("in_review");
    expect(nextStatus("publish", "in_review")).toBe("published");
    expect(nextStatus("unpublish", "published")).toBe("draft");
    expect(nextStatus("archive", "published")).toBe("archived");
    expect(nextStatus("restore", "archived")).toBe("draft");
    expect(nextStatus("plan", "draft")).toBe("planned");
  });

  it("refuses transitions that aren't allowed from the current status", () => {
    expect(nextStatus("submit", "published")).toBeNull();
    expect(nextStatus("publish", "archived")).toBeNull();
    expect(nextStatus("restore", "published")).toBeNull();
  });

  it("reserves publishing, unpublishing and archiving for administrators", () => {
    expect(requiresAdmin("publish")).toBe(true);
    expect(requiresAdmin("archive")).toBe(true);
    expect(requiresAdmin("submit")).toBe(false);
    expect(availableActions("in_review", ["learner", "instructor"])).not.toContain("publish");
    expect(availableActions("in_review", ["learner", "admin"])).toContain("publish");
    expect(availableActions("draft", ["learner", "instructor"])).toEqual(expect.arrayContaining(["submit", "plan"]));
  });
});

describe("publishing checks", () => {
  const loaded = loadLessonFiles("qa-foundations", "decision-tables");
  const shared = { minutes: loaded.shared.minutes, level: loaded.shared.level, skillsJson: JSON.stringify(loaded.shared.skills), reviewedOn: loaded.shared.reviewedOn };
  const en = lessonTranslationValues(loaded.en) as StoredLessonText;
  const ar = lessonTranslationValues(loaded.ar!) as StoredLessonText;

  it("passes a complete bilingual lesson", () => {
    expect(publishProblems(shared, en, ar)).toEqual([]);
  });

  it("requires the Arabic translation and a review date", () => {
    expect(publishProblems(shared, en, null)).toContain("missingArabic");
    expect(publishProblems({ ...shared, reviewedOn: null }, en, ar)).toContain("missingReviewDate");
  });

  it("requires a real body, a knowledge check and matching answer keys", () => {
    expect(publishProblems(shared, { ...en, body: "Too short." }, ar)).toContain("missingBody");
    expect(publishProblems(shared, { ...en, quizJson: "[]" }, ar)).toContain("missingQuiz");
    const quiz = JSON.parse(ar.quizJson) as { answer: string; options: { id: string }[] }[];
    quiz[0].answer = quiz[0].options.find((o) => o.id !== quiz[0].answer)!.id;
    expect(publishProblems(shared, en, { ...ar, quizJson: JSON.stringify(quiz) })).toContain("quizMismatch");
  });

  it("requires at least one skill", () => {
    expect(publishProblems({ ...shared, skillsJson: "[]" }, en, ar)).toContain("missingSkills");
  });
});
