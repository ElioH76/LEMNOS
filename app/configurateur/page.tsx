import type { Metadata, Viewport } from "next";
import { ConfiguratorLoader } from "@/components/configurator/ConfiguratorLoader";
import { configuratorFontsClassName } from "@/components/configurator/fonts";

export const metadata: Metadata = {
  title: "Configurateur 3D — Lemnos",
  description:
    "Créez le maillot de votre club en 3D : couleurs, motifs, logos, sponsors, nom et numéro. Demande de devis en un clic.",
};

export const viewport: Viewport = {
  themeColor: "#1A1D1F",
};

export default function ConfiguratorPage() {
  return (
    <div className={configuratorFontsClassName}>
      <ConfiguratorLoader />
    </div>
  );
}
