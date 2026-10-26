"use client";

import dynamic from "next/dynamic";

/**
 * Le configurateur est rendu uniquement côté navigateur (état initial lu
 * depuis le lien partagé / le brouillon local, WebGL). Son code — et surtout
 * three.js — n'est chargé que sur cette page.
 */
const Configurator = dynamic(() => import("./Configurator"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100dvh] items-center justify-center bg-paper">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-green" aria-label="Chargement du configurateur" />
    </div>
  ),
});

export function ConfiguratorLoader() {
  return <Configurator />;
}
