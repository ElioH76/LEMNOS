import type { Metadata } from "next";
import { baseOpenGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site-content";
import { cinzel, montserrat } from "./fonts";
import "./globals.css";

const description =
  "Maillots et vêtements de sport personnalisés pour clubs et associations. Un seul interlocuteur, du croquis à la livraison : on dessine, on prototype, on produit — vous validez à chaque étape.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Lemnos — Vêtements de sport personnalisés",
  description,
  openGraph: {
    ...baseOpenGraph,
    title: "Lemnos — Vêtements de sport personnalisés",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${cinzel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
