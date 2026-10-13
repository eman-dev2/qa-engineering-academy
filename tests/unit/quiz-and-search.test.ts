import { describe, expect, it } from "vitest";
import { answersFromFormData, scoreQuiz } from "@/lib/quiz";
import { paginate, searchDocs, tokenize, type SearchDoc } from "@/lib/search";
import type { QuizQuestion } from "@/lib/content/schema";

const questions: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "Which value is a boundary for 1 to 12?",
    options: [
      { id: "a", text: "6" },
      { id: "b", text: "12" },
    ],
    answer: "b",
    explanation: "12 is the maximum of the valid partition.",
  },
  {
    id: "q2",
    prompt: "Which status code means forbidden?",
    options: [
      { id: "a", text: "401" },
      { id: "b", text: "403" },
    ],
    answer: "b",
    explanation: "403 means authenticated but not allowed.",
  },
];

describe("scoreQuiz", () => {
  it("scores correct and incorrect answers", () => {
    const r = scoreQuiz(questions, { q1: "b", q2: "a" });
    expect(r.score).toBe(1);
    expect(r.total).toBe(2);
    expect(r.results.map((x) => x.correct)).toEqual([true, false]);
  });

  it("treats unknown option ids and missing answers as wrong, never as correct", () => {
    const r = scoreQuiz(questions, { q1: "z", q3: "b" });
    expect(r.score).toBe(0);
    expect(r.results[0].selected).toBeNull();
    expect(r.results[1].selected).toBeNull();
  });

  it("reads answers from q:-prefixed form fields only", () => {
    const fd = new FormData();
    fd.set("subject", "lesson:x/y");
    fd.set("q:q1", "b");
    fd.set("q:q2", "a");
    expect(answersFromFormData(fd)).toEqual({ q1: "b", q2: "a" });
  });
});

const doc = (id: string, title: string, body: string): SearchDoc => ({
  id,
  kind: "lesson",
  title,
  summary: body.slice(0, 40),
  href: `/${id}`,
  context: "",
  fields: [
    { text: title, weight: 6 },
    { text: body, weight: 1 },
  ],
});

describe("search", () => {
  const docs = [
    doc("ep", "Equivalence partitioning", "Partitions and boundary values for inputs."),
    doc("dt", "Decision tables", "Combinations of conditions. A boundary may matter."),
    doc("auth", "Authorization", "401 versus 403 and object level access."),
  ];

  it("tokenises, lowercases and drops stop words", () => {
    expect(tokenize("The Boundary of an Input")).toEqual(["boundary", "input"]);
  });

  it("requires every term to match (AND semantics)", () => {
    expect(searchDocs(docs, "boundary conditions").map((h) => h.doc.id)).toEqual(["dt"]);
  });

  it("ranks title matches above body matches", () => {
    expect(searchDocs(docs, "partitioning")[0].doc.id).toBe("ep");
  });

  it("matches prefixes", () => {
    expect(searchDocs(docs, "partition").map((h) => h.doc.id)).toContain("ep");
  });

  it("returns nothing for an empty query", () => {
    expect(searchDocs(docs, "   ")).toEqual([]);
  });

  it("clamps pagination to valid pages", () => {
    const items = Array.from({ length: 17 }, (_, i) => i);
    expect(paginate(items, 1, 8)).toMatchObject({ page: 1, totalPages: 3, total: 17, items: [0, 1, 2, 3, 4, 5, 6, 7] });
    expect(paginate(items, 3, 8).items).toEqual([16]);
    expect(paginate(items, 99, 8).page).toBe(3);
    expect(paginate(items, -4, 8).page).toBe(1);
    expect(paginate(items, Number.NaN, 8).page).toBe(1);
    expect(paginate([], 1, 8)).toMatchObject({ page: 1, totalPages: 1, total: 0 });
  });
});
