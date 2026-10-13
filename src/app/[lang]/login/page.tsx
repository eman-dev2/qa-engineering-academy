import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { safeNext } from "@/lib/auth/validation";
import { localePath, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { AuthLayout } from "@/components/auth-page";
import { AuthForm } from "@/components/auth-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.login, robots: { index: false } };
}

async function LoginForm({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, localePath(locale, "/dashboard"));
  if (await getCurrentUser()) redirect(next);
  return (
    <div className="space-y-5">
      {sp.reset === "1" && (
        <p role="status" className="rounded-md border border-pass/50 bg-pass-soft px-4 py-3 text-sm text-pass">
          {t.auth.resetDone}
        </p>
      )}
      <AuthForm mode="login" next={next} locale={locale} t={t.auth} />
    </div>
  );
}

export default async function LoginPage({ params, searchParams }: PageProps<"/[lang]/login">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthLayout title={t.auth.loginTitle} lead={t.auth.loginLead}>
      <Suspense fallback={<div className="h-80" aria-hidden />}>
        <LoginForm locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
