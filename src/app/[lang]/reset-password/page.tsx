import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { isResetTokenValid } from "@/lib/auth/reset";
import { localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { AuthLayout } from "@/components/auth-page";
import { ResetForm } from "@/components/auth-form";
import { buttonClass } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/reset-password">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.auth.resetTitle, robots: { index: false }, referrer: "no-referrer" };
}

async function ResetBody({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/reset-password">["searchParams"] }) {
  const raw = (await searchParams).token;
  await connection(); // token expiry is checked against the current time
  const token = typeof raw === "string" ? raw : "";
  if (!isResetTokenValid(token)) {
    return (
      <div className="space-y-5">
        <p role="alert" className="rounded-md border border-fail/50 bg-fail-soft px-4 py-3 text-sm text-fail">
          {t.auth.resetInvalid}
        </p>
        <Link href={localePath(locale, "/forgot-password")} className={buttonClass("primary", "w-full")}>
          {t.auth.requestNew}
        </Link>
      </div>
    );
  }
  return <ResetForm token={token} locale={locale} t={{ ...t.auth, saving: t.common.saving }} />;
}

export default async function ResetPasswordPage({ params, searchParams }: PageProps<"/[lang]/reset-password">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthLayout title={t.auth.resetTitle} lead={t.auth.resetLead}>
      <Suspense fallback={<div className="h-72" aria-hidden />}>
        <ResetBody locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
