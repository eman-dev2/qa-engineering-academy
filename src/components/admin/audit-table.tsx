import { formatDateValue, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Row = { id: number; action: string; entityType: string; entityId: string; detail: string | null; createdAt: Date; who: string | null };

export function AuditTable({ rows, locale, t }: { rows: Row[]; locale: Locale; t: Dictionary }) {
  if (rows.length === 0) return <p className="mt-2 text-ink-2">{t.admin.auditEmpty}</p>;
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-line-strong text-ink-3">
            <th scope="col" className="py-2 pe-3 text-start font-medium">{t.admin.auditCols.when}</th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">{t.admin.auditCols.who}</th>
            <th scope="col" className="py-2 pe-3 text-start font-medium">{t.admin.auditCols.action}</th>
            <th scope="col" className="py-2 text-start font-medium">{t.admin.auditCols.item}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line align-top">
              <td className="whitespace-nowrap py-2 pe-3 text-ink-2">{formatDateValue(locale, r.createdAt)}</td>
              <td className="py-2 pe-3">{r.who ?? t.admin.system}</td>
              <td className="ltr py-2 pe-3 font-mono text-xs">{r.action}</td>
              <td className="py-2">
                <span className="ltr font-mono text-xs">
                  {r.entityType}:{r.entityId}
                </span>
                {r.detail && <span className="block text-xs text-ink-3" dir="auto">{r.detail}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
