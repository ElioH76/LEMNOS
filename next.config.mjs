/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer doit rester hors du bundle serveur (dépendances natives).
  serverExternalPackages: ["@react-pdf/renderer"],
  // Demande de devis du configurateur 3D : aperçus + logos du client (≤ 4 Mo,
  // sous la limite de 4,5 Mo des fonctions Vercel).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Polices des PDF (lues depuis le disque au rendu) : à embarquer avec les
  // fonctions serveur qui génèrent des PDF sur Vercel — routes PDF, mais aussi
  // pages admin (les actions serveur d'émission et d'envoi email rendent le PDF).
  outputFileTracingIncludes: {
    "/admin/**": ["./lib/pdf/fonts/**/*"],
    "/devis/**": ["./lib/pdf/fonts/**/*"],
  },
};

export default nextConfig;
