import type { Metadata, Viewport } from "next";
import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/literata";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-500.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-600.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "@fontsource-variable/noto-naskh-arabic";
import "../globals.css";
import { site } from "@/content/site";
import { dirOf } from "@/i18n/config";
import { localeParams, resolveLocale } from "@/i18n/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { themeScript } from "@/components/theme-toggle";

export const generateStaticParams = localeParams;

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { locale, t } = await resolveLocale(params);
  return {
    metadataBase: new URL(site.url),
    title: { default: t.meta.titleDefault, template: `%s | ${t.meta.siteName}` },
    description: t.meta.description,
    applicationName: t.meta.siteName,
    authors: [{ name: site.owner.name, url: site.owner.linkedinUrl }],
    alternates: { languages: { en: "/", ar: "/ar" } },
    openGraph: {
      type: "website",
      siteName: t.meta.siteName,
      title: t.meta.siteName,
      description: t.meta.description,
      locale: locale === "ar" ? "ar" : "en",
    },
    twitter: { card: "summary_large_image", title: t.meta.siteName, description: t.meta.description },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#11131b" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { locale, t } = await resolveLocale(params);
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="skip-link">
          {t.common.skipToContent}
        </a>
        <SiteHeader locale={locale} t={t} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} t={t} />
      </body>
    </html>
  );
}
