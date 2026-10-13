import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { devOutboxEnabled } from "@/lib/mailer";
import { formatDateValue, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, PageHeading } from "@/components/ui";

export const metadata: Metadata = { robots: { index: false } };

async function Messages({ locale, t }: { locale: Locale; t: Dictionary }) {
  await connection();
  // The outbox shows password-reset links, so it must not exist on a public deployment.
  if (!devOutboxEnabled()) notFound();
  const rows = getDb().select().from(schema.emailOutbox).orderBy(desc(schema.emailOutbox.id)).limit(20).all();
  if (rows.length === 0) return <p className="mt-8 text-ink-2">{t.dev.outboxEmpty}</p>;
  return (
    <ol className="mt-8 space-y-4">
      {rows.map((m) => (
        <li key={m.id} className="rounded-lg border border-line bg-surface p-5">
          <p className="text-sm text-ink-3">
            {t.dev.to}: <span className="ltr font-mono">{m.to}</span> · {formatDateValue(locale, m.createdAt)}
          </p>
          <p className="mt-1 font-semibold">{m.subject}</p>
          <pre className="mt-3 whitespace-pre-wrap break-all font-mono text-sm text-ink-2" dir="auto">
            {m.text}
          </pre>
        </li>
      ))}
    </ol>
  );
}

export default async function OutboxPage({ params }: PageProps<"/[lang]/dev/outbox">) {
  // `next build` always runs with NODE_ENV=production, so production builds have no outbox page at all.
  if (!devOutboxEnabled()) notFound();
  const { locale, t } = await resolveLocale(params);
  return (
    <Container className="pb-16">
      <PageHeading title={t.dev.outboxTitle} lead={t.dev.outboxLead} />
      <Suspense fallback={<p className="mt-8 text-ink-3">{t.common.loading}</p>}>
        <Messages locale={locale} t={t} />
      </Suspense>
    </Container>
  );
}
