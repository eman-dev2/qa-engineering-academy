import type { ContentStatus, Role } from "@/lib/db/schema";

/**
 * Editorial workflow for lessons.
 *
 *   planned ──► draft ──► in_review ──► published ──► archived
 *      ▲          ▲  ◄────────┘  ◄──────────┘           │
 *      └──────────┴──────────────────────────────────────┘ (restore as draft)
 *
 * Instructors write and submit; only administrators publish, unpublish and archive.
 */
export type WorkflowAction = "submit" | "publish" | "unpublish" | "archive" | "restore" | "plan";

const transitions: Record<WorkflowAction, { from: ContentStatus[]; to: ContentStatus; adminOnly: boolean }> = {
  submit: { from: ["draft"], to: "in_review", adminOnly: false },
  publish: { from: ["draft", "in_review"], to: "published", adminOnly: true },
  unpublish: { from: ["in_review", "published"], to: "draft", adminOnly: true },
  archive: { from: ["draft", "in_review", "published", "planned"], to: "archived", adminOnly: true },
  restore: { from: ["archived", "planned"], to: "draft", adminOnly: false },
  plan: { from: ["draft"], to: "planned", adminOnly: false },
};

export function nextStatus(action: WorkflowAction, from: ContentStatus): ContentStatus | null {
  const t = transitions[action];
  return t.from.includes(from) ? t.to : null;
}

export function requiresAdmin(action: WorkflowAction): boolean {
  return transitions[action].adminOnly;
}

/** Actions to offer for a status, filtered by what the user may do. */
export function availableActions(status: ContentStatus, roles: Role[]): WorkflowAction[] {
  const isAdmin = roles.includes("admin");
  return (Object.keys(transitions) as WorkflowAction[]).filter((a) => transitions[a].from.includes(status) && (isAdmin || !transitions[a].adminOnly));
}

export function isWorkflowAction(v: unknown): v is WorkflowAction {
  return typeof v === "string" && v in transitions;
}
