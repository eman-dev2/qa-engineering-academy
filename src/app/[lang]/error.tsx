"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Container, buttonClass } from "@/components/ui";
import { stripLocale } from "@/i18n/config";

const copy = {
  en: {
    title: "Something went wrong on our side",
    lead: "The page couldn't be loaded. Try again. If it keeps happening, report it with the reference below.",
    reference: "Reference:",
    retry: "Try again",
  },
  ar: {
    title: "حدث خطأ من جهتنا",
    lead: "تعذّر تحميل الصفحة. حاول مرة أخرى، وإذا تكرر الخطأ فأبلغ عنه مع الرقم المرجعي أدناه.",
    reference: "الرقم المرجعي:",
    retry: "حاول مرة أخرى",
  },
};

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { locale } = stripLocale(usePathname() || "/");
  const c = copy[locale];
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container className="py-24">
      <h1 className="text-[2.2rem] font-bold tracking-[-0.02em]">{c.title}</h1>
      <p className="mt-3 max-w-[52ch] text-lg text-ink-2">{c.lead}</p>
      {error.digest && (
        <p className="mt-4 text-sm text-ink-3">
          {c.reference} <span className="font-mono ltr">{error.digest}</span>
        </p>
      )}
      <button type="button" onClick={() => retry()} className={buttonClass("primary", "mt-8")}>
        {c.retry}
      </button>
    </Container>
  );
}
