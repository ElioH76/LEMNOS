import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Espaces privés (déjà en noindex) et endpoints techniques.
      disallow: ["/admin", "/devis/", "/espace-client", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
