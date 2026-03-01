/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: {
    appIsrStatus: false, // Désactive l'indicateur de statut ISR
    buildActivity: false, // Désactive l'indicateur de build
  },
};

export default nextConfig;
