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

export async function generateMetadata({ params }: PageProps<"/[lang]/signup">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.nav.signup, robots: { index: false } };
}

async function SignupForm({ locale, t, searchParams }: { locale: Locale; t: Dictionary; searchParams: PageProps<"/[lang]/signup">["searchParams"] }) {
  const next = safeNext((await searchParams).next, localePath(locale, "/dashboard"));
  if (await getCurrentUser()) redirect(next);
  return <AuthForm mode="signup" next={next} locale={locale} t={t.auth} />;
}

export default async function SignupPage({ params, searchParams }: PageProps<"/[lang]/signup">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthLayout title={t.auth.signupTitle} lead={t.auth.signupLead} points={[t.auth.point1, t.auth.point2, t.auth.point3]}>
      <Suspense fallback={<div className="h-96" aria-hidden />}>
        <SignupForm locale={locale} t={t} searchParams={searchParams} />
      </Suspense>
    </AuthLayout>
  );
}
