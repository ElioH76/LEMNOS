import { Anton, Bebas_Neue, Oswald, Teko } from "next/font/google";
import { montserrat } from "@/app/fonts";
import type { TextFontId } from "@/lib/configurator/types";

/**
 * Polices sportives du flocage, chargées uniquement par le configurateur.
 * Le nom de famille généré par next/font est passé au <canvas> qui dessine
 * le texte appliqué en 3D.
 *
 * ⚠️ Ce module doit aussi être importé par la page serveur
 * (app/configurateur/page.tsx, via `configuratorFontsClassName`) : sinon les
 * @font-face ne sont pas émis, le configurateur étant chargé dynamiquement.
 */
const oswald = Oswald({ subsets: ["latin"], weight: ["700"], display: "swap", variable: "--font-cfg-oswald" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: ["400"], display: "swap", variable: "--font-cfg-bebas" });
const teko = Teko({ subsets: ["latin"], weight: ["600"], display: "swap", variable: "--font-cfg-teko" });
const anton = Anton({ subsets: ["latin"], weight: ["400"], display: "swap", variable: "--font-cfg-anton" });

export const configuratorFontsClassName = [oswald.variable, bebas.variable, teko.variable, anton.variable].join(" ");

export const TEXT_FONT_FACES: Record<TextFontId, { family: string; weight: number }> = {
  montserrat: { family: montserrat.style.fontFamily, weight: 800 },
  oswald: { family: oswald.style.fontFamily, weight: 700 },
  bebas: { family: bebas.style.fontFamily, weight: 400 },
  teko: { family: teko.style.fontFamily, weight: 600 },
  anton: { family: anton.style.fontFamily, weight: 400 },
};

/** Attend que la police soit réellement disponible pour le <canvas>. */
export async function ensureFontLoaded(id: TextFontId, sample: string): Promise<void> {
  const face = TEXT_FONT_FACES[id];
  try {
    await document.fonts.load(`${face.weight} 64px ${face.family}`, sample || "0");
  } catch {
    // Police indisponible : le canvas utilisera la police de repli.
  }
}
