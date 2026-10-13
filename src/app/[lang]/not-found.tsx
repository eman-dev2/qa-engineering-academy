"use client";

import { usePathname } from "next/navigation";
import { ButtonLink, Container } from "@/components/ui";
import { localePath, stripLocale } from "@/i18n/config";

const copy = {
  en: {
    title: "This page doesn't exist",
    lead: "The address may be mistyped, or the page may not be published yet. Planned content is listed on the roadmap.",
    paths: "Browse learning paths",
    search: "Search",
    roadmap: "See the roadmap",
  },
  ar: {
    title: "هذه الصفحة غير موجودة",
    lead: "ربما كُتب العنوان بشكل خاطئ، أو أن الصفحة لم تُنشر بعد. المحتوى المخطط له مذكور في خارطة الطريق.",
    paths: "تصفّح المسارات التعليمية",
    search: "البحث",
    roadmap: "اطّلع على خارطة الطريق",
  },
};

export default function NotFound() {
  const { locale } = stripLocale(usePathname() || "/");
  const c = copy[locale];
  const L = (p: string) => localePath(locale, p);
  return (
    <Container className="py-24">
      <p className="font-mono text-sm text-ink-3">404</p>
      <h1 className="mt-2 text-[2.4rem] font-bold tracking-[-0.02em]">{c.title}</h1>
      <p className="mt-3 max-w-[52ch] text-lg text-ink-2">{c.lead}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={L("/paths")}>{c.paths}</ButtonLink>
        <ButtonLink href={L("/search")} variant="secondary">
          {c.search}
        </ButtonLink>
        <ButtonLink href={L("/roadmap")} variant="quiet">
          {c.roadmap}
        </ButtonLink>
      </div>
    </Container>
  );
}
