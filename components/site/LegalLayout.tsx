import { Eyebrow, Shell } from "./Shell";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/**
 * Gabarit des pages légales (mentions légales, confidentialité, CGV) : même
 * fond nuit que l'accueil, titre en Cinzel, texte sobre et lisible.
 */
export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-deep text-white">
      <SiteNav />
      <header className="border-b border-night-line pb-12 pt-32 md:pb-16 md:pt-40">
        <Shell>
          <Eyebrow>Lemnos</Eyebrow>
          <h1 className="mt-4 font-serif text-[32px] font-bold leading-[1.05] md:text-[46px]">{title}</h1>
        </Shell>
      </header>

      <main className="py-16 md:py-20">
        <Shell>
          <div className="max-w-3xl">{children}</div>
        </Shell>
      </main>

      <SiteFooter />
    </div>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-12 text-[13px] font-bold uppercase tracking-label text-mint first:mt-0">{children}</h2>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.75] text-pearl">{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.65] text-pearl marker:text-mint">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
