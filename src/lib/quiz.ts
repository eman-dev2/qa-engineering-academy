import type { QuizQuestion } from "@/lib/content/schema";

export type QuestionResult = {
  id: string;
  selected: string | null;
  correct: boolean;
  answer: string;
  explanation: string;
};

export type QuizResult = {
  score: number;
  total: number;
  results: QuestionResult[];
};

/**
 * Score submitted answers against the server-side answer key.
 * Unknown question ids in the submission are ignored, and unanswered questions count as wrong.
 */
export function scoreQuiz(
  questions: QuizQuestion[],
  submitted: Record<string, string | null | undefined>,
): QuizResult {
  const results = questions.map((q) => {
    const raw = submitted[q.id];
    const selected = typeof raw === "string" && q.options.some((o) => o.id === raw) ? raw : null;
    return {
      id: q.id,
      selected,
      correct: selected === q.answer,
      answer: q.answer,
      explanation: q.explanation,
    };
  });
  return {
    score: results.filter((r) => r.correct).length,
    total: questions.length,
    results,
  };
}

/** Extract answers from FormData fields named "q:<questionId>". */
export function answersFromFormData(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (k.startsWith("q:") && typeof v === "string") out[k.slice(2)] = v;
  }
  return out;
}
