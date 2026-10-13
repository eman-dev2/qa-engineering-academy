import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/dashboard", "/account", "/admin", "/login", "/signup", "/forgot-password", "/reset-password", "/dev"];
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...privatePaths, ...privatePaths.map((p) => `/ar${p}`)] },
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
