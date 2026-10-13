import Link from "next/link";
import type { PathView } from "@/lib/content/types";
import type { LessonStatus } from "@/lib/progress";
import { format, localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { CheckIcon } from "@/components/icons";
import { cx } from "@/components/ui";

export function LessonNav({
  path,
  currentKey,
  statuses,
  locale,
  t,
}: {
  path: PathView;
  currentKey: string;
  statuses: Map<string, LessonStatus> | null;
  locale: Locale;
  t: Dictionary;
}) {
  const done = statuses ? path.lessons.filter((l) => statuses.get(l.key) === "completed").length : 0;
  return (
    <nav aria-label={format(t.lesson.navLabel, { path: path.title })} className="text-[0.93rem]">
      <p className="font-semibold text-ink">
        <Link href={localePath(locale, `/paths/${path.slug}`)} className="hover:text-pen">
          {path.title}
        </Link>
      </p>
      {statuses && <p className="mt-1 text-sm text-ink-3">{format(t.lesson.completedCount, { done, total: path.lessons.length })}</p>}
      {path.modules.map((m) => (
        <div key={m.slug} className="mt-5">
          <p className="text-sm font-medium text-ink-3">{m.title}</p>
          <ol className="mt-2 space-y-0.5">
            {m.lessons.map((l) => {
              if (l.status !== "published") {
                return (
                  <li key={l.key} className="flex items-start gap-2.5 px-2 py-1.5 leading-snug text-ink-3">
                    <span aria-hidden className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0 rounded-full border border-dashed border-line-strong" />
                    <span>
                      {l.title}
                      <span className="sr-only"> {t.lesson.plannedSr}</span>
                    </span>
                  </li>
                );
              }
              const current = l.key === currentKey;
              const status = statuses?.get(l.key) ?? "not-started";
              return (
                <li key={l.key}>
                  <Link
                    href={localePath(locale, `/paths/${path.slug}/${l.slug}`)}
                    aria-current={current ? "page" : undefined}
                    className={cx(
                      "flex items-start gap-2.5 rounded-md px-2 py-1.5 leading-snug",
                      current ? "bg-pen-soft font-semibold text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    <span
                      className={cx(
                        "mt-0.5 flex h-[1.1rem] w-[1.1rem] shrink-0 items-center justify-center rounded-full border text-[0.65rem] tabular-nums",
                        status === "completed" ? "border-pass bg-pass text-on-pen" : "border-line-strong text-ink-3",
                        status === "started" && "border-pen",
                      )}
                    >
                      {status === "completed" ? <CheckIcon size={11} strokeWidth={3} /> : l.position}
                    </span>
                    <span>
                      {l.title}
                      {status === "completed" && <span className="sr-only"> {t.paths.completedSr}</span>}
                      {status === "started" && <span className="sr-only"> {t.lesson.inProgressSr}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );
}
