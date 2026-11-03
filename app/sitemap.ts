import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-content";

/** Pages publiques indexables. Tant que la page d'attente est active, seule l'accueil existe. */
export default function sitemap(): MetadataRoute.Sitemap {
  const home = { url: `${siteUrl}/`, changeFrequency: "monthly" as const, priority: 1 };
  if (process.env.COMING_SOON === "true") return [home];

  return [
    home,
    { url: `${siteUrl}/configurateur`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/cgv`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
