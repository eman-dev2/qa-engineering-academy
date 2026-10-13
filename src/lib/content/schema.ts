import { z } from "zod";
import { skillIds } from "@/content/skills";
import { levels } from "@/lib/db/schema";

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD (quote it in YAML)");

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1),
    prompt: z.string().min(10),
    options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
    answer: z.string().min(1),
    explanation: z.string().min(10),
  })
  .refine((q) => q.options.some((o) => o.id === q.answer), { message: "answer must match one of the option ids" })
  .refine((q) => new Set(q.options.map((o) => o.id)).size === q.options.length, { message: "option ids must be unique" });

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizSchema = z
  .array(quizQuestionSchema)
  .refine((qs) => new Set(qs.map((q) => q.id)).size === qs.length, { message: "question ids must be unique" });

export const keyTermSchema = z.object({ term: z.string().min(1), definition: z.string().min(5) });
export const mistakeSchema = z.object({ mistake: z.string().min(5), fix: z.string().min(5) });
export const exerciseSchema = z.object({ title: z.string().min(3), brief: z.string().min(20), modelAnswer: z.string().min(20) });
export const referenceSchema = z.object({ title: z.string().min(2), url: z.url().startsWith("https://"), publisher: z.string().min(1) });

export type KeyTerm = z.infer<typeof keyTermSchema>;
export type Mistake = z.infer<typeof mistakeSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Reference = z.infer<typeof referenceSchema>;

/** Minimum body length (in words) for a lesson to be publishable. */
export const MIN_BODY_WORDS = 300;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Fields that are the same in every language. */
export const lessonSharedSchema = z.object({
  minutes: z.number().int().positive(),
  level: z.enum(levels),
  skills: z.array(z.enum(skillIds)).min(1),
  reviewedOn: isoDate,
});

/** Fields written once per language. Requirements here are the publishing bar. */
export const lessonTextSchema = z.object({
  title: z.string().min(3),
  summary: z.string().min(20),
  objectives: z.array(z.string().min(5)).min(2),
  prerequisites: z.array(z.string().min(3)).default([]),
  keyTerms: z.array(keyTermSchema).default([]),
  mistakes: z.array(mistakeSchema).min(2),
  exercise: exerciseSchema,
  quiz: quizSchema.refine((q) => q.length >= 3, { message: "at least 3 questions" }),
  references: z.array(referenceSchema).min(1),
});

export type LessonShared = z.infer<typeof lessonSharedSchema>;
export type LessonText = z.infer<typeof lessonTextSchema>;

/**
 * A translated knowledge check must keep the same question ids, option ids and answers,
 * so scoring and saved attempts mean the same thing in every language.
 */
export function quizKeysMatch(a: QuizQuestion[], b: QuizQuestion[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((q, i) => {
    const t = b[i];
    return (
      t.id === q.id &&
      t.answer === q.answer &&
      t.options.length === q.options.length &&
      t.options.every((o, j) => o.id === q.options[j].id)
    );
  });
}
