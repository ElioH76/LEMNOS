import { Cinzel, Montserrat } from "next/font/google";

/** Montserrat — toute la typographie : titres, corps, labels. */
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

/**
 * Cinzel — serif d'inscription gréco-romaine, accent « mythologique ».
 * Un seul mot-concept par titre, jamais en corps de texte.
 */
export const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});
