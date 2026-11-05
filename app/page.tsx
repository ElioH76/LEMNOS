import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { DemandSection } from "@/components/site/DemandSection";
import { Lookbook } from "@/components/site/Lookbook";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { contactEmail, siteUrl } from "@/lib/site-content";

/**
 * En production, `COMING_SOON=true` (variable d'environnement Vercel) affiche la
 * page d'attente ; en développement, la variable est absente → le site complet
 * est rendu. Aucune divergence de code entre les environnements.
 */
const comingSoon = process.env.COMING_SOON === "true";

export const metadata: Metadata = comingSoon
  ? { title: "Lemnos — Bientôt en ligne", alternates: { canonical: "/" } }
  : { alternates: { canonical: "/" } };

/** Données structurées : identité de la marque pour les moteurs de recherche. */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lemnos",
  url: siteUrl,
  logo: `${siteUrl}/apple-icon.png`,
  email: contactEmail,
  description: "Maillots et vêtements de sport personnalisés pour clubs et associations.",
  ...(process.env.NEXT_PUBLIC_INSTAGRAM_URL ? { sameAs: [process.env.NEXT_PUBLIC_INSTAGRAM_URL] } : {}),
};

export default function HomePage() {
  const jsonLd = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
    />
  );

  if (comingSoon)
    return (
      <>
        {jsonLd}
        <ComingSoon />
      </>
    );

  return (
    <div className="bg-ink-deep text-white">
      {jsonLd}
      <SiteNav />
      <main>
        <Lookbook />
        <DemandSection />
      </main>
      <SiteFooter />
    </div>
  );
}
