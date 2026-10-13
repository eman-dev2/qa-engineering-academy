/**
 * Site settings: the single source for owner details.
 * Change the owner's name or LinkedIn URL here and every page updates.
 * Translatable copy (taglines, descriptions) lives in src/i18n/dictionaries.
 */
export const site = {
  /**
   * Public address. NEXT_PUBLIC_SITE_URL wins (set it for a custom domain); on Render the
   * platform-provided RENDER_EXTERNAL_URL is used automatically, so no setup is needed there.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000").replace(/\/$/, ""),
  owner: {
    name: "Eman Abo-Oun",
    nameAr: "إيمان أبو عون",
    linkedinUrl: "https://www.linkedin.com/in/eman-abo-oun-28ba40207/",
  },
  contentReviewCadence: "quarterly",
} as const;

export type SiteSettings = typeof site;
