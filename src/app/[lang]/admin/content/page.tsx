import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/guard";
import { contentTree } from "@/lib/admin/queries";
import { formatDateValue, localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { ButtonLink, StatusBadge } from "@/components/ui";
import { AdminLoading, Forbidden, statusTone } from "@/components/admin/states";

export async function generateMetadata({ params }: PageProps<"/[lang]/admin/content">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.admin.content };
}

export default async function ContentPage({ params }: PageProps<"/[lang]/admin/content">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Suspense fallback={<AdminLoading />}>
      <Content locale={locale} t={t} />
    </Suspense>
  );
}

function Langs({ langs }: { langs: string[] }) {
  return (
    <span className="ltr inline-flex gap-1">
      {["en", "ar"].map((l) => (
        <span key={l} className={langs.includes(l) ? "rounded bg-pass-soft px-1 text-[0.7rem] font-semibold uppercase text-pass" : "rounded bg-surface-2 px-1 text-[0.7rem] font-semibold uppercase text-ink-3 line-through"}>
          {l}
        </span>
      ))}
    </span>
  );
}

async function Content({ locale, t }: { locale: Locale; t: Dictionary }) {
  const L = (p: string) => localePath(locale, p);
  const user = await requireStaffPage(L("/admin/content"));
  if (!user) return <Forbidden t={t} />;
  const tree = contentTree(locale);
  return (
    <div className="mt-8 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[2rem] font-bold tracking-[-0.02em]">{t.admin.content}</h1>
        <ButtonLink href={L("/admin/content/lessons/new")}>{t.admin.newLesson}</ButtonLink>
      </div>
      {tree.map((p) => (
        <section key={p.id} aria-labelledby={`path-${p.id}`} className="rounded-lg border border-line bg-surface">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={`path-${p.id}`} className="text-lg font-bold">
                {p.title}
              </h2>
              <StatusBadge label={t.statuses[p.status]} tone={statusTone(p.status)} />
              <Langs langs={p.languages} />
            </div>
            <Link href={L(`/admin/content/paths/${p.id}`)} className="text-sm font-semibold text-pen underline underline-offset-2">
              {t.admin.editPath}
            </Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-ink-3">
                  <th scope="col" className="px-5 py-2 text-start font-medium">{t.admin.colLesson}</th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colModule}</th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colStatus}</th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colLanguages}</th>
                  <th scope="col" className="px-3 py-2 text-start font-medium">{t.admin.colUpdated}</th>
                  <th scope="col" className="px-5 py-2 text-end font-medium">{t.admin.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {p.modules.flatMap((m) =>
                  m.lessons.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5 font-medium">{l.title}</td>
                      <td className="px-3 py-2.5 text-ink-2">{m.title}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge label={t.statuses[l.status]} tone={statusTone(l.status)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <Langs langs={l.languages} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{formatDateValue(locale, l.updatedAt)}</td>
                      <td className="whitespace-nowrap px-5 py-2.5 text-end">
                        <Link href={L(`/admin/content/lessons/${l.id}`)} className="font-semibold text-pen underline underline-offset-2">
                          {t.admin.editLesson}
                        </Link>
                        {l.status === "published" && (
                          <>
                            {" · "}
                            <Link href={L(`/paths/${p.slug}/${l.slug}`)} className="text-ink-2 underline underline-offset-2">
                              {t.admin.view}
                            </Link>
                          </>
                        )}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
