import type { SkillId } from "@/content/skills";
import type { ContentStatus, Level } from "@/lib/db/schema";
import type { Exercise, KeyTerm, Mistake, QuizQuestion, Reference } from "./schema";

export type LessonSummary = {
  id: number;
  /** "<path-slug>/<lesson-slug>", the stable key for user data */
  key: string;
  slug: string;
  pathSlug: string;
  moduleSlug: string;
  /** Order among all lessons of the path (published and planned) */
  order: number;
  /** 1-based position among published lessons, or null for planned ones */
  position: number | null;
  status: ContentStatus;
  title: string;
  summary: string;
  objectives: string[];
  minutes: number;
  level: Level;
  skills: SkillId[];
  /** True when the requested language was missing and English is shown */
  fallback: boolean;
};

export type ModuleView = { slug: string; title: string; summary: string; lessons: LessonSummary[] };

export type PathView = {
  id: number;
  slug: string;
  status: ContentStatus;
  startsAt: Level;
  leadsTo: Level;
  skills: SkillId[];
  title: string;
  summary: string;
  goal: string;
  prerequisites: string[];
  outcomes: string[];
  milestones: string[];
  modules: ModuleView[];
  /** Published lessons, in order */
  lessons: LessonSummary[];
  plannedCount: number;
  totalMinutes: number;
  fallback: boolean;
};

export type LessonDetail = LessonSummary & {
  prerequisites: string[];
  keyTerms: KeyTerm[];
  mistakes: Mistake[];
  exercise: Exercise;
  quiz: QuizQuestion[];
  references: Reference[];
  body: string;
  headings: { id: string; text: string }[];
  reviewedOn: string;
  publishedTotal: number;
};

export type ExamFacts = {
  questions: number | null;
  totalPoints: number | null;
  passingScore: number | null;
  durationMinutes: number | null;
  nonNativeExtension: string | null;
};

export type StudyWeek = { week: string; focus: string; activities: string[] };

export type CertificationView = {
  id: number;
  slug: string;
  code: string;
  name: string;
  issuer: string;
  version: string | null;
  stream: string;
  sourceUrl: string;
  reviewedOn: string | null;
  verified: boolean;
  exam: ExamFacts | null;
  chapters: string[];
  chaptersTranslated: string[] | null;
  officialLinks: { label: string; url: string }[];
  relatedPaths: string[];
  summary: string | null;
  audience: string[];
  prerequisites: string[];
  studyPlan: StudyWeek[];
  practice: QuizQuestion[];
  fallback: boolean;
};

export type VideoView = {
  id: number;
  youtubeId: string;
  title: string;
  creator: string;
  creatorUrl: string;
  language: string;
  level: Level;
  skills: SkillId[];
  relatedLessons: string[];
  verifiedOn: string | null;
  description: string;
};

export type TemplateView = { slug: string; format: string; title: string; description: string; filePath: string; relatedLessons: string[] };

export type ProjectView = {
  slug: string;
  level: Level;
  skills: SkillId[];
  relatedPaths: string[];
  hours: number;
  title: string;
  summary: string;
  brief: string;
  deliverables: string[];
  criteria: string[];
};

/** A question as sent to the browser: no answer, no explanation. */
export type PublicQuestion = { id: string; prompt: string; options: { id: string; text: string }[] };
