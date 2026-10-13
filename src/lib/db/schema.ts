import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Shared enums                                                        */
/* ------------------------------------------------------------------ */

export const roles = ["learner", "contributor", "instructor", "moderator", "admin"] as const;
export type Role = (typeof roles)[number];

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

/**
 * Editorial workflow. "planned" = outline only (title, summary, objectives), never readable;
 * only "published" content is visible to the public.
 */
export const contentStatuses = ["planned", "draft", "in_review", "published", "archived"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const levels = ["Beginner", "Junior", "Mid-level", "Senior", "Automation", "Lead", "Manager", "Head of QE"] as const;
export type Level = (typeof levels)[number];

const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull();
const updatedAt = () => integer("updated_at", { mode: "timestamp_ms" }).notNull();

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  preferredLocale: text("preferred_locale", { enum: locales }),
  /** Development-only demo account created by the seed script. */
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: roles }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] }), index("user_roles_role_idx").on(t.role)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the session token. The raw token only ever lives in the user's cookie. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    /** SHA-256 of the token sent by email. */
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [index("reset_user_idx").on(t.userId)],
);

/** Development mailer: messages are stored here instead of being sent. */
export const emailOutbox = sqliteTable("email_outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  text: text("text").notNull(),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ */
/* Learning data                                                       */
/* ------------------------------------------------------------------ */

export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** "<path-slug>/<lesson-slug>", stable across content edits */
    lessonKey: text("lesson_key").notNull(),
    status: text("status", { enum: ["started", "completed"] }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    updatedAt: updatedAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.lessonKey] }),
    index("progress_user_updated_idx").on(t.userId, t.updatedAt),
  ],
);

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** "lesson:<path>/<lesson>" or "cert:<slug>" */
    subjectKey: text("subject_key").notNull(),
    score: integer("score").notNull(),
    total: integer("total").notNull(),
    answersJson: text("answers_json").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("attempts_user_created_idx").on(t.userId, t.createdAt)],
);

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonKey: text("lesson_key").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonKey] })],
);

/* ------------------------------------------------------------------ */
/* Content: paths, modules, lessons                                    */
/* ------------------------------------------------------------------ */

export const learningPaths = sqliteTable(
  "learning_paths",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    startsAt: text("starts_at", { enum: levels }).notNull(),
    leadsTo: text("leads_to", { enum: levels }).notNull(),
    /** Skill ids from the taxonomy, JSON array */
    skillsJson: text("skills_json").notNull().default("[]"),
    status: text("status", { enum: contentStatuses }).notNull().default("draft"),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("paths_status_position_idx").on(t.status, t.position)],
);

export const pathTranslations = sqliteTable(
  "path_translations",
  {
    pathId: integer("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    goal: text("goal").notNull(),
    prerequisitesJson: text("prerequisites_json").notNull().default("[]"),
    outcomesJson: text("outcomes_json").notNull().default("[]"),
    milestonesJson: text("milestones_json").notNull().default("[]"),
  },
  (t) => [primaryKey({ columns: [t.pathId, t.locale] })],
);

export const modules = sqliteTable(
  "modules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pathId: integer("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("modules_path_slug_uq").on(t.pathId, t.slug)],
);

export const moduleTranslations = sqliteTable(
  "module_translations",
  {
    moduleId: integer("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
  },
  (t) => [primaryKey({ columns: [t.moduleId, t.locale] })],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pathId: integer("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    moduleId: integer("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    position: integer("position").notNull().default(0),
    minutes: integer("minutes").notNull(),
    level: text("level", { enum: levels }).notNull(),
    skillsJson: text("skills_json").notNull().default("[]"),
    status: text("status", { enum: contentStatuses }).notNull().default("draft"),
    reviewedOn: text("reviewed_on"),
    /** Set the first time the lesson is published; the slug is locked from then on. */
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("lessons_path_slug_uq").on(t.pathId, t.slug),
    index("lessons_module_position_idx").on(t.moduleId, t.position),
    index("lessons_status_idx").on(t.status),
  ],
);

export const lessonTranslations = sqliteTable(
  "lesson_translations",
  {
    lessonId: integer("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    /** Markdown. Empty for planned lessons. */
    body: text("body").notNull().default(""),
    objectivesJson: text("objectives_json").notNull().default("[]"),
    prerequisitesJson: text("prerequisites_json").notNull().default("[]"),
    keyTermsJson: text("key_terms_json").notNull().default("[]"),
    mistakesJson: text("mistakes_json").notNull().default("[]"),
    exerciseJson: text("exercise_json"),
    quizJson: text("quiz_json").notNull().default("[]"),
    referencesJson: text("references_json").notNull().default("[]"),
  },
  (t) => [primaryKey({ columns: [t.lessonId, t.locale] })],
);

/* ------------------------------------------------------------------ */
/* Certifications                                                      */
/* ------------------------------------------------------------------ */

export const certifications = sqliteTable(
  "certifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    code: text("code").notNull(),
    /** Official name, kept in the issuer's language */
    name: text("name").notNull(),
    issuer: text("issuer").notNull(),
    version: text("version"),
    stream: text("stream").notNull(),
    sourceUrl: text("source_url").notNull(),
    reviewedOn: text("reviewed_on"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    /** { questions, totalPoints, passingScore, durationMinutes, nonNativeExtension } or null */
    examJson: text("exam_json"),
    /** Official chapter titles (issuer's language) */
    chaptersJson: text("chapters_json").notNull().default("[]"),
    officialLinksJson: text("official_links_json").notNull().default("[]"),
    relatedPathsJson: text("related_paths_json").notNull().default("[]"),
    position: integer("position").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [index("certs_stream_position_idx").on(t.stream, t.position)],
);

export const certificationTranslations = sqliteTable(
  "certification_translations",
  {
    certificationId: integer("certification_id")
      .notNull()
      .references(() => certifications.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    summary: text("summary"),
    audienceJson: text("audience_json").notNull().default("[]"),
    prerequisitesJson: text("prerequisites_json").notNull().default("[]"),
    /** Translated chapter titles, same order as chaptersJson (optional) */
    chaptersJson: text("chapters_json"),
    studyPlanJson: text("study_plan_json").notNull().default("[]"),
    practiceJson: text("practice_json").notNull().default("[]"),
  },
  (t) => [primaryKey({ columns: [t.certificationId, t.locale] })],
);

/* ------------------------------------------------------------------ */
/* Resources: videos, templates, practice projects                     */
/* ------------------------------------------------------------------ */

export const videos = sqliteTable(
  "videos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    youtubeId: text("youtube_id").notNull().unique(),
    /** Original title as published by the creator (never translated) */
    title: text("title").notNull(),
    creator: text("creator").notNull(),
    creatorUrl: text("creator_url").notNull(),
    language: text("language").notNull(),
    level: text("level", { enum: levels }).notNull(),
    skillsJson: text("skills_json").notNull().default("[]"),
    relatedLessonsJson: text("related_lessons_json").notNull().default("[]"),
    status: text("status", { enum: contentStatuses }).notNull().default("draft"),
    /** Date the link, title and creator were last checked against YouTube */
    verifiedOn: text("verified_on"),
    addedBy: text("added_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("videos_status_idx").on(t.status)],
);

export const videoTranslations = sqliteTable(
  "video_translations",
  {
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    /** Our own note on why the video is useful */
    description: text("description").notNull(),
  },
  (t) => [primaryKey({ columns: [t.videoId, t.locale] })],
);

export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  format: text("format").notNull(),
  skillsJson: text("skills_json").notNull().default("[]"),
  /** Lesson keys ("<path>/<lesson>") this template supports */
  relatedLessonsJson: text("related_lessons_json").notNull().default("[]"),
  status: text("status", { enum: contentStatuses }).notNull().default("draft"),
  position: integer("position").notNull().default(0),
  updatedAt: updatedAt(),
});

export const templateTranslations = sqliteTable(
  "template_translations",
  {
    templateId: integer("template_id")
      .notNull()
      .references(() => templates.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    /** Path under /public, e.g. "/templates/en/defect-report.md" */
    filePath: text("file_path").notNull(),
  },
  (t) => [primaryKey({ columns: [t.templateId, t.locale] })],
);

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  level: text("level", { enum: levels }).notNull(),
  skillsJson: text("skills_json").notNull().default("[]"),
  /** Path slugs this project belongs to */
  relatedPathsJson: text("related_paths_json").notNull().default("[]"),
  hours: integer("hours").notNull(),
  status: text("status", { enum: contentStatuses }).notNull().default("draft"),
  position: integer("position").notNull().default(0),
  updatedAt: updatedAt(),
});

export const projectTranslations = sqliteTable(
  "project_translations",
  {
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    locale: text("locale", { enum: locales }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    /** Markdown */
    brief: text("brief").notNull(),
    deliverablesJson: text("deliverables_json").notNull().default("[]"),
    criteriaJson: text("criteria_json").notNull().default("[]"),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.locale] })],
);

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    detail: text("detail"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (t) => [index("audit_entity_idx").on(t.entityType, t.entityId), index("audit_created_idx").on(t.createdAt)],
);
