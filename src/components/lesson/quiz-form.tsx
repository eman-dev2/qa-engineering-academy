"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitQuiz, type QuizActionState } from "@/app/actions/learning";
import type { PublicQuestion } from "@/lib/content/types";
import type { Dictionary } from "@/i18n";
import { format, type Locale } from "@/i18n/config";
import { CheckIcon, CrossIcon } from "@/components/icons";
import { buttonClass, cx } from "@/components/ui";
import { InlineText } from "@/components/inline-text";

type Props = {
  subject: string;
  questions: PublicQuestion[];
  locale: Locale;
  t: Dictionary["quiz"];
  loginHref: string;
  dashboardHref: string;
};

export function QuizForm(props: Props) {
  // Re-mounting the attempt gives a fresh form and action state for "Try again".
  const [attempt, setAttempt] = useState(0);
  return <QuizAttempt key={attempt} {...props} onRetry={() => setAttempt((a) => a + 1)} />;
}

/** Split a template around one {placeholder} so a link can sit in the middle. */
function around(template: string, key: string): [string, string] {
  const [a, b = ""] = template.split(`{${key}}`);
  return [a, b];
}

function QuizAttempt({ subject, questions, locale, t, loginHref, dashboardHref, onRetry }: Props & { onRetry: () => void }) {
  const [state, action, pending] = useActionState<QuizActionState, FormData>(submitQuiz, { status: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const scored = state.status === "scored" ? state : null;
  const resultFor = (id: string) => scored?.results.find((r) => r.id === id);
  const answeredCount = Object.keys(answers).length;
  const statusId = `${subject.replace(/[^a-z0-9]/gi, "-")}-status`;

  return (
    <form action={action} aria-describedby={statusId} className="space-y-6">
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="locale" value={locale} />
      {questions.map((q, qi) => {
        const r = resultFor(q.id);
        return (
          <fieldset
            key={q.id}
            className={cx("rounded-lg border bg-surface p-5", r ? (r.correct ? "border-pass/60" : "border-fail/60") : "border-line")}
          >
            <legend className="sr-only">{format(t.question, { n: qi + 1 })}</legend>
            <p className="flex gap-3 font-semibold leading-snug text-ink">
              <span className="tabular-nums text-ink-3" aria-hidden>
                {qi + 1}.
              </span>
              <span>
                <InlineText text={q.prompt} />
              </span>
            </p>
            <div className="mt-4 space-y-2">
              {q.options.map((o) => {
                const checked = answers[q.id] === o.id;
                const isAnswer = r?.answer === o.id;
                const wrongPick = r && checked && !r.correct;
                return (
                  <label
                    key={o.id}
                    className={cx(
                      "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-[0.97rem] leading-snug",
                      !r && (checked ? "border-pen bg-pen-soft" : "border-line hover:border-line-strong"),
                      r && isAnswer && "border-pass bg-pass-soft",
                      wrongPick && "border-fail bg-fail-soft",
                      r && !isAnswer && !wrongPick && "border-line opacity-75",
                      r && "cursor-default",
                    )}
                  >
                    <input
                      type="radio"
                      name={`q:${q.id}`}
                      value={o.id}
                      checked={checked}
                      disabled={!!r || pending}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--pen)]"
                    />
                    <span className="flex-1">
                      <InlineText text={o.text} />
                    </span>
                    {r && isAnswer && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pass">
                        <CheckIcon size={14} /> {t.correctAnswer}
                      </span>
                    )}
                    {wrongPick && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-fail">
                        <CrossIcon size={14} /> {t.yourAnswer}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {r && (
              <p className="mt-4 border-t border-line pt-3 text-[0.95rem] leading-relaxed text-ink-2">
                <span className={cx("font-semibold", r.correct ? "text-pass" : "text-fail")}>{r.correct ? t.correct : t.notQuite} </span>
                <InlineText text={r.explanation} />
              </p>
            )}
          </fieldset>
        );
      })}

      <div id={statusId} aria-live="polite" className="space-y-3">
        {state.status === "error" && (
          <p role="alert" className="rounded-md border border-fail/50 bg-fail-soft px-4 py-3 text-sm text-fail">
            {state.message}
          </p>
        )}
        {scored && (
          <div className="rounded-lg border border-line-strong bg-surface p-5">
            <p className="text-lg font-bold">
              {format(t.scored, { score: scored.score, total: scored.total })}
              {scored.score === scored.total && ` ${t.perfect}`}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {scored.saved ? (
                <>
                  {around(t.savedTo, "dashboard")[0]}
                  <Link className="text-pen underline" href={dashboardHref}>
                    {t.dashboard}
                  </Link>
                  {around(t.savedTo, "dashboard")[1]}
                </>
              ) : (
                <>
                  {around(t.notSaved, "login")[0]}
                  <Link className="text-pen underline" href={loginHref}>
                    {t.logIn}
                  </Link>
                  {around(t.notSaved, "login")[1]}
                </>
              )}
            </p>
            <button type="button" onClick={onRetry} className={buttonClass("secondary", "mt-4")}>
              {t.tryAgain}
            </button>
          </div>
        )}
      </div>

      {!scored && (
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={pending} className={buttonClass("primary")}>
            {pending ? t.checking : t.check}
          </button>
          <span className="text-sm text-ink-3">{format(t.answered, { answered: answeredCount, total: questions.length })}</span>
        </div>
      )}
    </form>
  );
}
