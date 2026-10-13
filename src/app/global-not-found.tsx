import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/schibsted-grotesk";
import "@fontsource/ibm-plex-sans-arabic/arabic-400.css";
import "@fontsource/ibm-plex-sans-arabic/arabic-700.css";
import "./globals.css";
import { themeScript } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "404: Page not found | QA Engineering Academy",
  description: "The page you are looking for does not exist.",
  robots: { index: false },
};

/** Rendered for URLs that match no route at all. Bilingual, because the language is unknown. */
export default function GlobalNotFound() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <main id="main" className="mx-auto w-full max-w-[76rem] flex-1 px-4 py-24 sm:px-6 lg:px-8">
          <p className="font-mono text-sm text-ink-3">404</p>
          <div className="mt-6 grid gap-12 md:grid-cols-2">
            <section>
              <h1 className="text-[2.2rem] font-bold tracking-[-0.02em]">This page doesn&apos;t exist</h1>
              <p className="mt-3 text-lg text-ink-2">The address may be mistyped, or the page may have moved.</p>
              <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-pen px-4 font-semibold text-on-pen hover:bg-pen-hover">
                Go to the home page
              </Link>
            </section>
            <section lang="ar" dir="rtl">
              <h2 className="text-[2.2rem] font-bold">هذه الصفحة غير موجودة</h2>
              <p className="mt-3 text-lg text-ink-2">ربما كُتب العنوان بشكل خاطئ، أو أن الصفحة نُقلت.</p>
              <Link href="/ar" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-pen px-4 font-semibold text-on-pen hover:bg-pen-hover">
                الذهاب إلى الصفحة الرئيسية
              </Link>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
