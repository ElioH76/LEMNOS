import type { Metadata } from "next";
import { ComingSoon } from "@/components/site/ComingSoon";
import { AtelierSection } from "@/components/site/AtelierSection";
import { Hero } from "@/components/site/Hero";
import { MethodSection } from "@/components/site/MethodSection";
import { ProjectForm } from "@/components/site/ProjectForm";
import { RealisationsSection } from "@/components/site/RealisationsSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { siteConfig } from "@/lib/site-config";

/**
 * En production, `COMING_SOON=true` (variable d'environnement Vercel) affiche la
 * page d'attente ; en développement, la variable est absente → le site complet
 * est rendu. Aucune divergence de code entre les environnements.
 */
const comingSoon = process.env.COMING_SOON === "true";

export const metadata: Metadata = comingSoon
  ? { title: "Lemnos — Bientôt en ligne" }
  : {};

export default function HomePage() {
  if (comingSoon) return <ComingSoon />;

  return (
    <>
      <SiteNav />
      <Hero />
      <MethodSection />
      {siteConfig.showRealisations && <RealisationsSection />}
      <AtelierSection />
      <ProjectForm />
      <SiteFooter />
    </>
  );
}
