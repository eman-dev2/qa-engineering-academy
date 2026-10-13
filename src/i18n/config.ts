export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function dirOf(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Public URL for a path in a locale. English lives at the root ("/paths"),
 * Arabic under "/ar" ("/ar/paths"). The proxy rewrites English URLs to /en internally.
 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") return clean;
  return clean === "/" ? "/ar" : `/ar${clean}`;
}

/** Strip a locale prefix from a pathname: "/ar/paths" -> "/paths". */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  if (pathname === "/ar" || pathname.startsWith("/ar/")) {
    return { locale: "ar", path: pathname.slice(3) || "/" };
  }
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    return { locale: "en", path: pathname.slice(3) || "/" };
  }
  return { locale: "en", path: pathname || "/" };
}

/** Replace {name} placeholders. */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Locale-aware plurals (Arabic has zero/one/two/few/many/other forms). */
export function plural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(count);
  return format(forms[rule] ?? forms.other, { count });
}

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** Deterministic date formatting (same output on server and client): "11 October 2026" / "11 أكتوبر 2026". */
export function formatIsoDate(locale: Locale, iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = locale === "ar" ? AR_MONTHS : EN_MONTHS;
  return `${d} ${months[m - 1]} ${y}`;
}

export function formatDateValue(locale: Locale, date: Date): string {
  return formatIsoDate(locale, date.toISOString());
}

/** "2 h 5 min" / "ساعتان و5 دقائق", with correct Arabic number agreement. */
export function formatMinutes(locale: Locale, min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (locale === "ar") {
    const arCount = (n: number, one: string, two: string, few: string, many: string) =>
      n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? `${n} ${few}` : `${n} ${many}`;
    const minutes = (n: number) => arCount(n, "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة");
    if (h === 0) return minutes(min);
    const hours = arCount(h, "ساعة", "ساعتان", "ساعات", "ساعة");
    return m ? `${hours} و${minutes(m)}` : hours;
  }
  if (h === 0) return `${min} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
