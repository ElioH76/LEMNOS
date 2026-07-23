import { AtelierSection } from "@/components/site/AtelierSection";
import { Hero } from "@/components/site/Hero";
import { MethodSection } from "@/components/site/MethodSection";
import { ProjectForm } from "@/components/site/ProjectForm";
import { RealisationsSection } from "@/components/site/RealisationsSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <Hero />
      <MethodSection />
      <RealisationsSection />
      <AtelierSection />
      <ProjectForm />
      <SiteFooter />
    </>
  );
}
