/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer doit rester hors du bundle serveur (dépendances natives).
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
