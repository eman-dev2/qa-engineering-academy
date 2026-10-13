import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPaths, getProjects } from "@/lib/content/repo";
import { renderMarkdown } from "@/lib/markdown";
import { format, localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { Container } from "@/components/ui";
import { InlineText } from "@/components/inline-text";

export const instant = false;

export async function generateStaticParams({ params }: { params: { lang: string } }) {
  const projects = await getProjects(params.lang === "ar" ? "ar" : "en");
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/library/projects/[slug]">): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const slug = (await params).slug;
  const p = (await getProjects(locale)).find((x) => x.slug === slug);
  return p ? { title: p.title, description: p.summary, alternates: { languages: { en: `/library/projects/${slug}`, ar: `/ar/library/projects/${slug}` } } } : {};
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/library/projects/[slug]">) {
  const { locale, t } = await resolveLocale(params);
  const slug = (await params).slug;
  const [projects, paths] = await Promise.all([getProjects(locale), getPaths(locale)]);
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();
  const L = (p: string) => localePath(locale, p);
  const briefHtml = await renderMarkdown(project.brief);
  const related = project.relatedPaths.map((s) => paths.find((p) => p.slug === s)).filter((p) => p !== undefined);

  return (
    <Container className="pb-12">
      <nav aria-label="Breadcrumb" className="pt-6 text-sm text-ink-3">
        <Link href={`${L("/library")}#projects`} className="hover:text-pen">
          {t.library.projectBreadcrumb}
        </Link>
      </nav>
      <header className="border-b border-line pb-8 pt-5">
        <p className="text-sm text-ink-3">
          {t.levels[project.level]} · {format(t.library.hours, { hours: project.hours })}
        </p>
        <h1 className="mt-2 max-w-[26ch] text-[2.1rem] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[2.6rem]">{project.title}</h1>
        <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-ink-2">{project.summary}</p>
      </header>
      <div className="grid gap-12 py-10 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="brief">
          <h2 id="brief" className="text-2xl font-bold tracking-[-0.01em]">
            {t.library.brief}
          </h2>
          <div className="prose-lesson mt-4" dangerouslySetInnerHTML={{ __html: briefHtml }} />
        </section>
        <aside className="space-y-8">
          <section aria-labelledby="deliverables">
            <h2 id="deliverables" className="text-lg font-bold">
              {t.library.deliverables}
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 ps-5 text-[0.97rem] text-ink-2">
              {project.deliverables.map((d) => (
                <li key={d}>
                  <InlineText text={d} />
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="criteria">
            <h2 id="criteria" className="text-lg font-bold">
              {t.library.criteria}
            </h2>
            <ul className="mt-3 space-y-2.5 text-[0.97rem] leading-relaxed">
              {project.criteria.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <span aria-hidden className="mt-[0.7rem] h-1.5 w-3 shrink-0 bg-highlighter" />
                  <span>
                    <InlineText text={c} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="text-lg font-bold">
                {t.certs.relatedPaths}
              </h2>
              <ul className="mt-3 space-y-2">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link href={L(`/paths/${p.slug}`)} className="font-semibold text-pen underline underline-offset-2">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </Container>
  );
}
