"use client";

import { Component, type ReactNode } from "react";

/** Isole les erreurs du moteur 3D : le reste du configurateur reste utilisable. */
export class ViewerErrorBoundary extends Component<{ fallback: (message: string) => ReactNode; children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message || "Erreur 3D inconnue." };
  }
  componentDidCatch(error: Error) {
    console.error("[configurateur] rendu 3D impossible :", error);
  }
  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}

