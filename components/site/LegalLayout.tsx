import { Eyebrow, Shell } from "./Shell";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/**
 * Gabarit des pages légales (mentions légales, confidentialité, CGV) :
 * bandeau sombre avec le titre (la nav blanche y reste lisible), puis le texte
 * sur fond clair, et le footer du site. Typographie sobre et lisible.
 */
export function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <header className="relative overflow-hidden bg-ink pb-12 pt-32 text-white md:pb-16 md:pt-40">
        <Shell>
          <Eyebrow tone="dark">Lemnos</Eyebrow>
          <h1 className="mt-4 text-[32px] font-extrabold tracking-tight md:text-[42px]">{title}</h1>
        </Shell>
      </header>

      <main className="bg-paper py-16 md:py-20">
        <Shell>
          <div className="mx-auto max-w-3xl">{children}</div>
        </Shell>
      </main>

      <SiteFooter />
    </>
  );
}

export function LegalH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 text-[19px] font-bold tracking-tight text-ink first:mt-0 md:text-[21px]">
      {children}
    </h2>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.75] text-slate">{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.65] text-slate marker:text-green">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
