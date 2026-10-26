export type ViewName = "front" | "back" | "left" | "right";

export interface CaptureOptions {
  size: number;
  /** null = fond transparent. */
  background: string | null;
  format: "image/png" | "image/jpeg";
}

/** Commandes exposées à l'interface (boutons de vue, zoom, export). */
export interface ViewerApi {
  setView: (view: ViewName) => void;
  zoom: (step: number) => void;
  reset: () => void;
  /** Rendu réel de la scène, vue de face puis de dos. */
  capture: (options: CaptureOptions) => { front: string; back: string };
}

