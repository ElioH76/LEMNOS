import type { Metadata, Viewport } from "next";
import { ConfiguratorLoader } from "@/components/configurator/ConfiguratorLoader";
import { configuratorFontsClassName } from "@/components/configurator/fonts";
import { baseOpenGraph } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Configurateur 3D — Lemnos",
  description:
    "Créez le maillot de votre club en 3D : couleurs, motifs, logos, sponsors, nom et numéro. Demande de devis en un clic.",
  alternates: { canonical: "/configurateur" },
  openGraph: {
    ...baseOpenGraph,
    title: "Configurateur 3D de maillots — Lemnos",
    description:
      "Créez le maillot de votre club en 3D : couleurs, motifs, logos, sponsors, nom et numéro. Demande de devis en un clic.",
    url: "/configurateur",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A1D1F",
};

export default function ConfiguratorPage() {
  return (
    <div className={configuratorFontsClassName}>
      {/* Le configurateur est rendu côté navigateur uniquement : titre et
          résumé rendus côté serveur pour les moteurs et lecteurs d'écran. */}
      <div className="sr-only">
        <h1>Configurateur 3D de maillots de sport personnalisés</h1>
        <p>
          Personnalisez le maillot de votre club en 3D : couleurs, motifs, blason, sponsors, nom
          et numéro des joueurs. Visualisez le résultat face et dos, exportez-le, puis envoyez
          votre demande de devis à Lemnos.
        </p>
      </div>
      <ConfiguratorLoader />
    </div>
  );
}
