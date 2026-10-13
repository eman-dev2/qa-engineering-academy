import type { Metadata } from "next";
import { localePath } from "@/i18n/config";
import { resolveLocale } from "@/i18n/server";
import { Container } from "@/components/ui";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({ children, params }: LayoutProps<"/[lang]/admin">) {
  const { locale, t } = await resolveLocale(params);
  const L = (p: string) => localePath(locale, p);
  return (
    <Container className="pb-16 pt-8">
      <p className="text-sm font-semibold text-ink-3">{t.admin.title}</p>
      <div className="mt-3">
        <AdminNav
          label={t.admin.navLabel}
          items={[
            { href: L("/admin"), label: t.admin.overview, exact: true },
            { href: L("/admin/content"), label: t.admin.content },
            { href: L("/admin/certifications"), label: t.admin.certifications },
            { href: L("/admin/videos"), label: t.admin.videosNav },
            { href: L("/admin/users"), label: t.admin.usersNav },
            { href: L("/admin/audit"), label: t.admin.audit },
          ]}
        />
      </div>
      {children}
    </Container>
  );
}
