import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Gabarit des pages de création / modification. */
export function FormPage({ back, backLabel, title, children }: { back: string; backLabel: string; title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link href={back} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ash transition-colors hover:text-green">
        <ArrowLeft size={15} /> {backLabel}
      </Link>
      <h1 className="mb-6 text-[24px] font-extrabold tracking-tight sm:mb-8 sm:text-[28px]">{title}</h1>
      {children}
    </main>
  );
}
