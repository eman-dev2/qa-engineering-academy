/**
 * Site settings: the single source for owner details.
 * Change the owner's name or LinkedIn URL here and every page updates.
 * Translatable copy (taglines, descriptions) lives in src/i18n/dictionaries.
 */
export const site = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  owner: {
    name: "Eman Abo-Oun",
    nameAr: "إيمان أبو عون",
    linkedinUrl: "https://www.linkedin.com/in/eman-abo-oun-28ba40207/",
  },
  contentReviewCadence: "quarterly",
} as const;

export type SiteSettings = typeof site;
