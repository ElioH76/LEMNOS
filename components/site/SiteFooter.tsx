import { LogoLockup } from "@/components/brand/LogoLockup";
import { contactEmail, instagramUrl } from "@/lib/site-content";
import { Shell } from "./Shell";

const LINK = "w-fit text-[14px] text-fog transition-colors hover:text-white";
const META = "text-[12px] text-mute-ink transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="border-t border-night-line bg-ink-deep text-white">
      <Shell className="flex flex-col gap-10 py-14 md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-[34ch] flex-col gap-5">
          <LogoLockup markClassName="w-[26px] text-white" wordmarkClassName="text-[18px]" className="gap-2.5" />
          <p className="text-[14px] leading-[1.6] text-mute-ink">
            Maillots et vêtements de sport personnalisés pour les clubs. Du croquis à la livraison.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold uppercase tracking-label text-mint">Contact</span>
          <a href={`mailto:${contactEmail}`} className={LINK}>
            {contactEmail}
          </a>
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
            Instagram
          </a>
        </div>
      </Shell>

      <div className="border-t border-night-line">
        <Shell className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-6">
          <span className="text-[12px] text-mute-ink">© 2026 Lemnos</span>
          <nav aria-label="Informations légales" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <a href="/mentions-legales" className={META}>
              Mentions légales
            </a>
            <a href="/confidentialite" className={META}>
              Confidentialité
            </a>
            <a href="/cgv" className={META}>
              CGV
            </a>
          </nav>
        </Shell>
      </div>
    </footer>
  );
}
