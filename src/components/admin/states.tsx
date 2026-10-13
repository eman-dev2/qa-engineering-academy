import type { Dictionary } from "@/i18n";

export function AdminLoading() {
  return (
    <div aria-busy="true" className="mt-8 animate-pulse space-y-4">
      <div className="h-8 w-64 rounded bg-surface-2" />
      <div className="h-40 rounded-lg bg-surface-2" />
    </div>
  );
}

export function Forbidden({ t, adminOnly = false }: { t: Dictionary; adminOnly?: boolean }) {
  return (
    <div role="alert" className="mt-8 max-w-[60ch] rounded-lg border border-warn/50 bg-warn-soft p-6">
      <h2 className="text-lg font-bold text-ink">{adminOnly ? t.admin.adminOnlyTitle : t.admin.forbiddenTitle}</h2>
      <p className="mt-2 text-ink-2">{adminOnly ? t.admin.adminOnlyLead : t.admin.forbiddenLead}</p>
    </div>
  );
}

export function statusTone(status: string): "neutral" | "pass" | "warn" | "pen" | "fail" {
  return status === "published" ? "pass" : status === "in_review" ? "pen" : status === "archived" ? "fail" : status === "planned" ? "warn" : "neutral";
}
