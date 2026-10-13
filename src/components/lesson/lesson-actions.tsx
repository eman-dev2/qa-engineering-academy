"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { recordLessonVisit, toggleBookmark, toggleLessonComplete } from "@/app/actions/learning";
import type { Locale } from "@/i18n/config";
import { BookmarkIcon, CheckIcon } from "@/components/icons";
import { buttonClass, cx } from "@/components/ui";

export function VisitRecorder({ lessonKey }: { lessonKey: string }) {
  useEffect(() => {
    void recordLessonVisit(lessonKey);
  }, [lessonKey]);
  return null;
}

export function BookmarkButton({ lessonKey, initial, locale, labels }: { lessonKey: string; initial: boolean; locale: Locale; labels: { save: string; saved: string } }) {
  const [saved, setSaved] = useOptimistic(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        aria-pressed={saved}
        aria-busy={pending}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setSaved(!saved);
            const res = await toggleBookmark(lessonKey, !saved, locale);
            setError(res.ok ? null : res.error);
          })
        }
        className={buttonClass("secondary", "min-h-10 px-3 text-sm")}
      >
        <BookmarkIcon size={16} filled={saved} className={saved ? "text-pen" : undefined} />
        {saved ? labels.saved : labels.save}
      </button>
      {error && <p className="mt-1 text-sm text-fail">{error}</p>}
    </div>
  );
}

export function CompleteToggle({
  lessonKey,
  initial,
  locale,
  labels,
}: {
  lessonKey: string;
  initial: boolean;
  locale: Locale;
  labels: { mark: string; completed: string; hint: string };
}) {
  const [done, setDone] = useOptimistic(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={done}
        aria-busy={pending}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setDone(!done);
            const res = await toggleLessonComplete(lessonKey, !done, locale);
            setError(res.ok ? null : res.error);
          })
        }
        className={cx(buttonClass(done ? "secondary" : "primary"), done && "border-pass text-pass hover:border-pass")}
      >
        {done && <CheckIcon size={18} />}
        {done ? labels.completed : labels.mark}
      </button>
      {done && <span className="text-sm text-ink-2">{labels.hint}</span>}
      {error && <p className="w-full text-sm text-fail">{error}</p>}
    </div>
  );
}

/** "{login} or {signup} to save…" with both placeholders as links. */
export function SignInToSave({ template, loginHref, signupHref, loginText, signupText }: { template: string; loginHref: string; signupHref: string; loginText: string; signupText: string }) {
  const parts = template.split(/(\{login\}|\{signup\})/);
  const link = "font-semibold text-pen underline underline-offset-2";
  return (
    <p className="text-[0.95rem] text-ink-2">
      {parts.map((p, i) =>
        p === "{login}" ? (
          <Link key={i} href={loginHref} className={link}>
            {loginText}
          </Link>
        ) : p === "{signup}" ? (
          <Link key={i} href={signupHref} className={link}>
            {signupText}
          </Link>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}
