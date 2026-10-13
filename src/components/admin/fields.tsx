import { useId, type ReactNode } from "react";
import { cx } from "@/components/ui";

const control = "mt-1.5 w-full rounded-md border border-line-strong bg-surface px-3 text-ink";


export function TextInput({
  name,
  label,
  defaultValue,
  hint,
  type = "text",
  dir,
  readOnly,
  required,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  hint?: string;
  type?: string;
  dir?: "ltr" | "rtl" | "auto";
  readOnly?: boolean;
  required?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-ink-3">
          {hint}
        </p>
      )}
      <input
        id={id}
        name={name}
        type={type}
        dir={dir}
        defaultValue={defaultValue ?? ""}
        readOnly={readOnly}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cx(control, "h-11", readOnly && "bg-surface-2 text-ink-2")}
      />
    </div>
  );
}

export function TextArea({
  name,
  label,
  defaultValue,
  hint,
  rows = 4,
  dir,
  mono,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  hint?: string;
  rows?: number;
  dir?: "ltr" | "rtl" | "auto";
  mono?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-ink-3">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        name={name}
        rows={rows}
        dir={dir}
        defaultValue={defaultValue ?? ""}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cx(control, "py-2 leading-relaxed", mono && "font-mono text-[0.85rem]")}
      />
    </div>
  );
}

export function Select({
  name,
  label,
  defaultValue,
  options,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  options: { value: string | number; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue ?? undefined} className={cx(control, "h-11")}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Checkboxes({ name, legend, options, checked }: { name: string; legend: string; options: { value: string; label: string; disabled?: boolean }[]; checked: string[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.value} className="flex items-start gap-2 text-sm">
            <input type="checkbox" name={name} value={o.value} defaultChecked={checked.includes(o.value)} disabled={o.disabled} className="mt-0.5 h-4 w-4 accent-[var(--pen)]" />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[var(--pen)]" />
      <span>{label}</span>
    </label>
  );
}

export function Section({ title, children, lang, dir }: { title: string; children: ReactNode; lang?: string; dir?: "ltr" | "rtl" }) {
  return (
    <section lang={lang} dir={dir} className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}
