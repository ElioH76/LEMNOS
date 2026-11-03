import type { Metadata } from "next";

/**
 * Socle Open Graph commun. Une page qui définit son propre `openGraph` remplace
 * celui du layout en entier : elle doit repartir de ce socle (image comprise).
 */
export const baseOpenGraph = {
  type: "website",
  locale: "fr_FR",
  siteName: "Lemnos",
  images: [
    {
      url: "/opengraph-image.jpg",
      width: 1200,
      height: 630,
      alt: "Équipe du FC Littoral en maillots Lemnos personnalisés",
    },
  ],
} satisfies Metadata["openGraph"];
