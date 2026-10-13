import type { Metadata } from "next";
import { resolveLocale } from "@/i18n/server";
import { devOutboxEnabled } from "@/lib/mailer";
import { AuthLayout } from "@/components/auth-page";
import { ForgotForm } from "@/components/auth-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/forgot-password">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.auth.forgotTitle, robots: { index: false } };
}

export default async function ForgotPasswordPage({ params }: PageProps<"/[lang]/forgot-password">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <AuthLayout title={t.auth.forgotTitle} lead={t.auth.forgotLead}>
      <ForgotForm locale={locale} t={t.auth} devOutbox={devOutboxEnabled()} />
    </AuthLayout>
  );
}
