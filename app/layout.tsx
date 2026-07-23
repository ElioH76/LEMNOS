import type { Metadata } from "next";
import { cinzel, montserrat } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lemnos — Vêtements de sport personnalisés",
  description:
    "Un seul interlocuteur, du croquis à la livraison. On dessine, on prototype, on produit — vous validez à chaque étape.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${cinzel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
