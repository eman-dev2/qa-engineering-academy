"use client";

import { useId, useState } from "react";
import type { Dictionary } from "@/i18n";
import { format } from "@/i18n/config";
import { CheckIcon, CrossIcon } from "./icons";
import { cx } from "./ui";

/** Accept Arabic-Indic digits and the Arabic decimal separator as well as ASCII. */
function normalizeNumber(raw: string) {
  return raw
    .trim()
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u066B,]/g, ".");
}

/**
 * A live exercise: the requirement says ">= 50.00 ships free"; the "implementation" uses "> 50".
 * Visitors probe values and discover why boundary values matter.
 */
const FEE = "2.50";

function expected(total: number) {
  return total >= 50 ? "0.00" : FEE;
}
function actual(total: number) {
  return total > 50 ? "0.00" : FEE; // the defect under test
}

type Probe = { value: string; total: number; expected: string; actual: string; pass: boolean };

const suggestions = ["35.00", "49.99", "50.00", "50.01"];

export function BoundaryProbe({ t }: { t: Dictionary["probe"] }) {
  const [probes, setProbes] = useState<Probe[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const found = probes.some((p) => !p.pass);

  function run(raw: string) {
    const v = normalizeNumber(raw);
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(v)) {
      setError(t.invalid);
      return;
    }
    setError(null);
    const total = Number(v);
    const e = expected(total);
    const a = actual(total);
    const formatted = total.toFixed(2);
    setProbes((prev) =>
      [{ value: formatted, total, expected: e, actual: a, pass: e === a }, ...prev.filter((p) => p.value !== formatted)].slice(0, 6),
    );
    setInput("");
  }

  return (
    <section
      aria-labelledby="probe-title"
      className="rounded-lg border border-line-strong bg-surface shadow-[0_1px_0_var(--line),0_18px_40px_-28px_rgba(22,26,44,0.45)]"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 id="probe-title" className="text-sm font-semibold text-ink">
          {t.title}
        </h2>
        <p className="mt-2 font-serif text-[0.98rem] leading-relaxed text-ink">
          <span className="mark">{t.rule}</span> {format(t.ruleRest, { fee: FEE })}
        </p>
      </div>

      <div className="px-5 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
          className="flex flex-wrap items-end gap-2"
          noValidate
        >
          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-ink-2">
              {t.inputLabel}
            </label>
            <input
              id={inputId}
              inputMode="decimal"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              placeholder={t.placeholder}
              dir="ltr"
              className="mt-1 h-11 w-full rounded-md border border-line-strong bg-paper px-3 font-mono text-[0.95rem] text-ink placeholder:text-ink-3"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-md bg-pen px-4 text-[0.95rem] font-semibold text-on-pen hover:bg-pen-hover"
          >
            {t.run}
          </button>
        </form>
        {error && (
          <p id={errorId} className="mt-2 text-sm text-fail">
            {error}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-ink-3">{t.orTry}</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => run(s)}
              className="rounded border border-line px-2 py-1 font-mono text-[0.82rem] text-ink-2 hover:border-pen hover:text-pen"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <table className="w-full text-start text-sm">
          <caption className="sr-only">{t.resultsCaption}</caption>
          <thead>
            <tr className="text-ink-3">
              <th scope="col" className="px-5 py-2 text-start font-medium">{t.colTotal}</th>
              <th scope="col" className="px-2 py-2 text-start font-medium">{t.colExpected}</th>
              <th scope="col" className="px-2 py-2 text-start font-medium">{t.colActual}</th>
              <th scope="col" className="px-5 py-2 text-end font-medium">{t.colResult}</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {probes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 pb-4 pt-1 text-ink-3">
                  {t.empty}
                </td>
              </tr>
            ) : (
              probes.map((p) => (
                <tr key={p.value} className="border-t border-line">
                  <td className="px-5 py-2 font-mono">{p.value}</td>
                  <td className="px-2 py-2 font-mono">{p.expected}</td>
                  <td className="px-2 py-2 font-mono">{p.actual}</td>
                  <td className="px-5 py-2 text-end">
                    <span
                      className={cx(
                        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold",
                        p.pass ? "bg-pass-soft text-pass" : "bg-fail-soft text-fail",
                      )}
                    >
                      {p.pass ? <CheckIcon size={13} /> : <CrossIcon size={13} />}
                      {p.pass ? t.pass : t.fail}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-line px-5 py-4 text-sm leading-relaxed" aria-live="polite">
        {found ? (
          <p className="text-ink">
            <strong className="font-semibold">{t.foundTitle}</strong>{" "}
            {t.foundText.split(/(\{actual\}|\{expected\})/).map((part, i) =>
              part === "{actual}" ? (
                <code key={i} className="rounded bg-surface-2 px-1 font-mono text-[0.85em]">
                  total &gt; 50
                </code>
              ) : part === "{expected}" ? (
                <code key={i} className="rounded bg-surface-2 px-1 font-mono text-[0.85em]">
                  &gt;= 50
                </code>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </p>
        ) : (
          <p className="text-ink-2">{t.hint}</p>
        )}
      </div>
    </section>
  );
}
