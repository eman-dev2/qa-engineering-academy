import type { ReactNode } from "react";
import { Container } from "./ui";

/** Two-column layout shared by login, signup and password recovery pages. */
export function AuthLayout({ title, lead, points, children }: { title: string; lead: string; points?: string[]; children: ReactNode }) {
  return (
    <Container className="grid gap-12 py-14 md:grid-cols-[1fr_26rem] md:py-20">
      <div className="max-w-[34rem]">
        <h1 className="text-[2.3rem] font-bold leading-[1.15] tracking-[-0.02em]">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-2">{lead}</p>
        {points && (
          <ul className="mt-6 space-y-2 text-[0.97rem] text-ink-2">
            {points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-lg border border-line bg-surface p-6 sm:p-8">{children}</div>
    </Container>
  );
}
