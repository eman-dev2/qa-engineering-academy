import { describe, expect, it } from "vitest";
import en from "@/i18n/dictionaries/en";
import ar from "@/i18n/dictionaries/ar";
import { format, formatIsoDate, formatMinutes, localePath, plural, stripLocale, dirOf, isLocale } from "@/i18n/config";
import { tokenize } from "@/lib/search";

/** Every leaf path in a nested object, e.g. "auth.errors.email". */
function leaves(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) return [`${prefix}[]`];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

function placeholders(s: string): string[] {
  return [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

function strings(obj: unknown, prefix = ""): [string, string][] {
  if (typeof obj === "string") return [[prefix, obj]];
  if (obj === null || typeof obj !== "object") return [];
  if (Array.isArray(obj)) return obj.flatMap((v, i) => strings(v, `${prefix}[${i}]`));
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => strings(v, prefix ? `${prefix}.${k}` : k));
}

describe("dictionaries", () => {
  it("Arabic has exactly the same keys as English", () => {
    // Plural forms legitimately differ (Arabic has zero/two/few/many), so compare without them.
    // certs.linkLabels is a lookup table from stored English labels to display names: only Arabic needs entries.
    const strip = (paths: string[]) => paths.filter((p) => !/\.(zero|one|two|few|many)$/.test(p) && !p.startsWith("certs.linkLabels")).sort();
    const enKeys = strip(leaves(en));
    const arKeys = strip(leaves(ar));
    expect(arKeys.filter((k) => !enKeys.includes(k))).toEqual([]);
    expect(enKeys.filter((k) => !arKeys.includes(k))).toEqual([]);
  });

  it("has no empty strings", () => {
    for (const [key, value] of [...strings(en), ...strings(ar)]) expect(value.trim().length, key).toBeGreaterThan(0);
  });

  it("uses the same placeholders in both languages", () => {
    const arStrings = new Map(strings(ar));
    for (const [key, value] of strings(en)) {
      if (/\.(zero|one|two|few|many)$/.test(key)) continue;
      const other = arStrings.get(key);
      if (other === undefined) continue; // lists may have different lengths (e.g. popular search terms)
      expect(placeholders(other), key).toEqual(placeholders(value));
    }
  });

  it("actually translates the interface (Arabic strings are mostly Arabic script)", () => {
    const arabic = strings(ar).filter(([, v]) => /[؀-ۿ]/.test(v)).length;
    expect(arabic / strings(ar).length).toBeGreaterThan(0.85);
  });
});

describe("locale helpers", () => {
  it("builds and strips locale-prefixed paths (English unprefixed, Arabic under /ar)", () => {
    expect(localePath("en", "/paths")).toBe("/paths");
    expect(localePath("ar", "/paths")).toBe("/ar/paths");
    expect(localePath("ar", "/")).toBe("/ar");
    expect(stripLocale("/ar/paths/qa-foundations")).toEqual({ locale: "ar", path: "/paths/qa-foundations" });
    expect(stripLocale("/ar")).toEqual({ locale: "ar", path: "/" });
    expect(stripLocale("/arabic-page")).toEqual({ locale: "en", path: "/arabic-page" });
    expect(stripLocale("/paths")).toEqual({ locale: "en", path: "/paths" });
  });

  it("knows the text direction and the supported locales", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  it("fills placeholders and leaves unknown ones visible", () => {
    expect(format("{a} of {b}", { a: 1, b: 2 })).toBe("1 of 2");
    expect(format("{a} and {missing}", { a: "x" })).toBe("x and {missing}");
  });

  it("uses Arabic plural categories", () => {
    const forms = { zero: "صفر", one: "واحد", two: "اثنان", few: "قليل", many: "كثير", other: "آخر" };
    expect(plural("ar", 0, forms)).toBe("صفر");
    expect(plural("ar", 1, forms)).toBe("واحد");
    expect(plural("ar", 2, forms)).toBe("اثنان");
    expect(plural("ar", 5, forms)).toBe("قليل");
    expect(plural("ar", 11, forms)).toBe("كثير");
    expect(plural("ar", 100, forms)).toBe("آخر");
    expect(plural("en", 1, { one: "one", other: "other" })).toBe("one");
    expect(plural("en", 3, { one: "one", other: "other" })).toBe("other");
  });

  it("formats durations with correct Arabic agreement", () => {
    expect(formatMinutes("en", 45)).toBe("45 min");
    expect(formatMinutes("en", 90)).toBe("1 h 30 min");
    expect(formatMinutes("ar", 1)).toBe("دقيقة واحدة");
    expect(formatMinutes("ar", 2)).toBe("دقيقتان");
    expect(formatMinutes("ar", 5)).toBe("5 دقائق");
    expect(formatMinutes("ar", 25)).toBe("25 دقيقة");
  });

  it("formats ISO dates deterministically in both languages", () => {
    expect(formatIsoDate("en", "2026-10-12")).toBe("12 October 2026");
    expect(formatIsoDate("ar", "2026-10-12")).toContain("2026");
    expect(formatIsoDate("ar", "2026-10-12")).toMatch(/[؀-ۿ]/);
  });
});

describe("Arabic search normalisation", () => {
  it("matches with or without the definite article and hamza forms", () => {
    expect(tokenize("الاختبار")).toEqual(tokenize("اختبار"));
    expect(tokenize("أخطاء")).toEqual(tokenize("اخطاء"));
  });

  it("drops Arabic stop words and diacritics", () => {
    expect(tokenize("في الاختبار")).toEqual(tokenize("اختبار"));
    expect(tokenize("اختِبار")).toEqual(tokenize("اختبار"));
  });
});
