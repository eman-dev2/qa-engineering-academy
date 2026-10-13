import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getCertifications, getPaths, getProjects } from "@/lib/content/repo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.url.replace(/\/$/, "");
  const [paths, certs, projects] = await Promise.all([getPaths("en"), getCertifications("en"), getProjects("en")]);
  const pages: { path: string; lastModified?: string }[] = [
    ...["/", "/paths", "/certifications", "/library", "/about", "/roadmap", "/search"].map((path) => ({ path })),
    ...paths.flatMap((p) => [
      { path: `/paths/${p.slug}` },
      ...p.lessons.map((l) => ({ path: `/paths/${p.slug}/${l.slug}` })),
    ]),
    ...certs.filter((c) => c.verified).map((c) => ({ path: `/certifications/${c.slug}`, lastModified: c.reviewedOn ?? undefined })),
    ...projects.map((p) => ({ path: `/library/projects/${p.slug}` })),
  ];
  return pages.map(({ path, lastModified }) => {
    const en = `${base}${path === "/" ? "" : path}` || base;
    const ar = `${base}/ar${path === "/" ? "" : path}`;
    return { url: en, lastModified, alternates: { languages: { en, ar } } };
  });
}
