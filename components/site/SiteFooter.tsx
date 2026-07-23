import { LogoLockup } from "@/components/brand/LogoLockup";
import { Mark } from "@/components/brand/Mark";
import { contactEmail, navLinks } from "@/lib/site-content";
import { Shell } from "./Shell";

const LINK = "link-underline w-fit text-[14px] text-fog transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer>
      {/* Bande de signature — Vert Littoral */}
      <div className="bg-green py-7 text-white">
        <Shell className="flex items-center justify-center gap-5">
          <Mark className="w-[26px] text-white" />
          <span className="text-[14px] font-medium uppercase tracking-band">Forger vos idées</span>
        </Shell>
      </div>

      <div className="bg-ink text-white">
        <Shell className="pb-10 pt-16">
          <div className="flex flex-wrap justify-between gap-10 border-b border-line-dark pb-12">
            <div className="max-w-[32ch]">
              <LogoLockup markClassName="w-[28px] text-white" wordmarkClassName="text-[20px]" />
              <p className="mt-5 text-[14px] leading-[1.6] text-mute-ink">
                Vêtements et équipements de sport personnalisés, forgés sur-mesure pour les collectifs
                qui portent leur identité.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-16 gap-y-8">
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-caps text-stone">
                  Navigation
                </span>
                {navLinks.map((link) => (
                  <a key={link.href} href={link.href} className={LINK}>
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-caps text-stone">
                  Contact
                </span>
                <a href={`mailto:${contactEmail}`} className={LINK}>
                  {contactEmail}
                </a>
                <a href="#projet" className={LINK}>
                  Instagram
                </a>
                <a href="#projet" className={LINK}>
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3.5 pt-8">
            <span className="text-[12px] text-stone">© 2026 Lemnos — Forger vos idées.</span>
            <span className="text-[12px] text-stone">Mentions légales · Confidentialité</span>
          </div>
        </Shell>
      </div>
    </footer>
  );
}
