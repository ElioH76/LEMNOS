import { Instagram } from "lucide-react";
import { Mark } from "@/components/brand/Mark";
import { instagramUrl } from "@/lib/site-content";

/**
 * Page d'attente publique (« bientôt en ligne »). Sobre, premium, responsive.
 * Affichée à la racine quand la variable d'environnement `COMING_SOON=true`
 * (production), sinon le site complet est rendu (développement).
 *
 * Le lien Instagram (`instagramUrl`) est configurable via `NEXT_PUBLIC_INSTAGRAM_URL`
 * (Vercel), sans toucher au code.
 */
export function ComingSoon() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6 py-16 text-center">
      {/* Halo vert diffus — profondeur discrète */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green/20 blur-[130px]"
      />

      <div className="relative flex animate-reveal flex-col items-center">
        <Mark className="w-16 text-white sm:w-[76px]" />

        <h1 className="mt-8 font-serif text-[32px] font-extrabold uppercase tracking-hero text-white sm:text-[46px]">
          Lemnos
        </h1>
        <p className="mt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-green-light sm:text-[11px]">
          Vêtements de sport personnalisés
        </p>

        <span aria-hidden className="my-9 h-px w-14 bg-white/20" />

        <h2 className="max-w-md text-[20px] font-semibold tracking-tight text-white sm:text-[25px]">
          Site en cours de finalisation
        </h2>
        <p className="mt-4 max-w-sm text-[14px] leading-[1.7] text-white/55">
          Nos premières réalisations seront dévoilées très prochainement.
        </p>

        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-11 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition-colors hover:border-green-light hover:text-white"
        >
          <Instagram size={17} aria-hidden />
          Suivez-nous sur Instagram
        </a>
      </div>

      <p className="absolute bottom-6 text-[10.5px] uppercase tracking-caps text-white/25">
        © {new Date().getFullYear()} Lemnos
      </p>
    </main>
  );
}
