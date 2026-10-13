import { lessonSharedSchema, lessonTextSchema, quizKeysMatch, wordCount, MIN_BODY_WORDS, type QuizQuestion } from "@/lib/content/schema";

/** A lesson translation row as stored (JSON columns still serialised). */
export type StoredLessonText = {
  title: string;
  summary: string;
  body: string;
  objectivesJson: string;
  prerequisitesJson: string;
  keyTermsJson: string;
  mistakesJson: string;
  exerciseJson: string | null;
  quizJson: string;
  referencesJson: string;
};

export type StoredLessonShared = { minutes: number; level: string; skillsJson: string; reviewedOn: string | null };

export type PublishProblem =
  | "missingArabic"
  | "missingBody"
  | "missingQuiz"
  | "missingExercise"
  | "missingReferences"
  | "missingObjectives"
  | "missingMistakes"
  | "missingReviewDate"
  | "missingSkills"
  | "quizMismatch";

const safe = <T,>(v: string | null, fallback: T): T => {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};

export function toLessonText(row: StoredLessonText) {
  return {
    title: row.title,
    summary: row.summary,
    objectives: safe<string[]>(row.objectivesJson, []),
    prerequisites: safe<string[]>(row.prerequisitesJson, []),
    keyTerms: safe(row.keyTermsJson, []),
    mistakes: safe(row.mistakesJson, []),
    exercise: safe(row.exerciseJson, null),
    quiz: safe<QuizQuestion[]>(row.quizJson, []),
    references: safe(row.referencesJson, []),
  };
}

/**
 * Everything that stops a lesson being published, in both languages. The bar is the same one
 * the seed files must meet: complete English and Arabic text, a real body, a 3+ question
 * knowledge check with matching answer keys, an exercise, references and a review date.
 */
export function publishProblems(shared: StoredLessonShared, en: StoredLessonText | null, ar: StoredLessonText | null): PublishProblem[] {
  const problems = new Set<PublishProblem>();
  if (!shared.reviewedOn) problems.add("missingReviewDate");
  const sharedCheck = lessonSharedSchema.safeParse({ ...shared, skills: safe(shared.skillsJson, []), reviewedOn: shared.reviewedOn ?? "" });
  if (!sharedCheck.success && sharedCheck.error.issues.some((i) => i.path[0] === "skills")) problems.add("missingSkills");
  if (!ar) problems.add("missingArabic");
  for (const row of [en, ar]) {
    if (!row) continue;
    if (wordCount(row.body) < MIN_BODY_WORDS) problems.add("missingBody");
    const parsed = lessonTextSchema.safeParse(toLessonText(row));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        if (field === "quiz") problems.add("missingQuiz");
        else if (field === "exercise") problems.add("missingExercise");
        else if (field === "references") problems.add("missingReferences");
        else if (field === "objectives") problems.add("missingObjectives");
        else if (field === "mistakes") problems.add("missingMistakes");
        else problems.add(row === ar ? "missingArabic" : "missingBody");
      }
    }
  }
  if (en && ar && !quizKeysMatch(toLessonText(en).quiz, toLessonText(ar).quiz)) problems.add("quizMismatch");
  return [...problems];
}
