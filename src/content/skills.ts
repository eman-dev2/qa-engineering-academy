/**
 * Curriculum taxonomy from the project brief (section 5). Display names live in the dictionaries.
 * Lessons declare which skills they build; the dashboard skill map is derived from this.
 */
export const skillIds = [
  "fundamentals",
  "manual",
  "test-management",
  "api",
  "programming",
  "ui-automation",
  "mobile",
  "sql",
  "performance",
  "security",
  "cicd",
  "advanced-qe",
  "fintech",
  "leadership",
  "career",
] as const;

export type SkillId = (typeof skillIds)[number];
