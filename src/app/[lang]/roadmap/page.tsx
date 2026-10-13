import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/server";
import { Container, PageHeading, cx } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/roadmap">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.roadmap.title, description: t.roadmap.metaDescription, alternates: { languages: { en: "/roadmap", ar: "/ar/roadmap" } } };
}

const statusStyle = {
  Available: "bg-pass-soft text-pass",
  Next: "bg-pen-soft text-pen",
  Planned: "bg-surface-2 text-ink-2",
} as const;

export default async function RoadmapPage({ params }: PageProps<"/[lang]/roadmap">) {
  const { t } = await resolveLocale(params);
  return (
    <Container>
      <PageHeading title={t.roadmap.title} lead={t.roadmap.lead} />
      <div className="max-w-[56rem] space-y-12 py-12">
        {t.roadmap.phases.map((ph, i) => (
          <section key={ph.name} aria-labelledby={`phase-${i}`}>
            <h2 id={`phase-${i}`} className="text-2xl font-bold tracking-[-0.01em]">
              {ph.name}
            </h2>
            <p className="mt-1 text-ink-2">{ph.summary}</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {ph.items.map(([label, status]) => (
                <li key={label} className="flex items-start justify-between gap-4 py-3">
                  <span className="leading-relaxed">{label}</span>
                  <span className={cx("shrink-0 rounded px-2 py-0.5 text-sm font-semibold", statusStyle[status])}>{t.roadmap.status[status]}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
