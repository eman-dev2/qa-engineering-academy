import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/dal";
import { countSessions } from "@/lib/auth/session";
import { format, localePath, plural, type Locale } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { Container, PageHeading, StatusBadge } from "@/components/ui";
import { Card } from "@/components/form";
import { DeleteAccountForm, PasswordForm, ProfileForm, SessionsForm } from "@/components/account-forms";

export async function generateMetadata({ params }: PageProps<"/[lang]/account">): Promise<Metadata> {
  const { t } = await resolveLocale(params);
  return { title: t.account.title, robots: { index: false } };
}

export default async function AccountPage({ params }: PageProps<"/[lang]/account">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <Container className="pb-16">
      <PageHeading title={t.account.title} lead={t.account.lead} />
      <Suspense fallback={<p className="mt-8 text-ink-3">{t.common.loading}</p>}>
        <Settings locale={locale} t={t} />
      </Suspense>
    </Container>
  );
}

async function Settings({ locale, t }: { locale: Locale; t: Dictionary }) {
  const user = await requireUser(localePath(locale, "/account"));
  const sessions = countSessions(user.id);
  const text = { auth: t.auth, account: t.account, common: t.common };
  const h2 = "text-xl font-bold";
  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      <Card>
        <h2 className={h2}>{t.account.profile}</h2>
        <div className="mt-5">
          <ProfileForm locale={locale} t={text} user={{ name: user.name, email: user.email, preferredLocale: user.preferredLocale ?? locale }} />
        </div>
      </Card>
      <div className="space-y-8">
        <Card>
          <h2 className={h2}>{t.account.passwordTitle}</h2>
          <div className="mt-5">
            <PasswordForm locale={locale} t={text} />
          </div>
        </Card>
        <Card>
          <h2 className={h2}>{t.account.sessionsTitle}</h2>
          <p className="mt-2 text-ink-2">{format(plural(locale, sessions, t.account.sessionsLead), { count: sessions })}</p>
          <div className="mt-4">
            <SessionsForm locale={locale} t={text} disabled={sessions <= 1} />
          </div>
        </Card>
        <Card>
          <h2 className={h2}>{t.account.rolesTitle}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <li key={r}>
                <StatusBadge label={t.admin.users.roleNames[r]} tone={r === "admin" ? "pen" : "neutral"} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="border-fail/40 lg:col-span-2">
        <h2 className={h2}>{t.account.deleteTitle}</h2>
        <p className="mt-2 max-w-[62ch] text-ink-2">{t.account.deleteLead}</p>
        <div className="mt-5 max-w-md">
          <DeleteAccountForm locale={locale} t={text} />
        </div>
      </Card>
    </div>
  );
}
