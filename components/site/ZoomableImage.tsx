"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Vignette cliquable qui ouvre l'image en grand (lightbox). Fermeture par
 * Échap, clic sur le fond, ou le bouton. La version agrandie charge le fichier
 * original en pleine résolution pour voir tous les détails du mockup.
 */
export function ZoomableImage({
  src,
  alt,
  sizes,
  className,
  children,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Agrandir : ${alt}`}
        className={cn(
          "group/zoom relative block w-full cursor-zoom-in overflow-hidden",
          className,
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 group-hover/zoom:scale-[1.03]"
        />
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover/zoom:opacity-100"
        >
          <ZoomIn size={15} />
        </span>
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm sm:p-8"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X size={20} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] w-auto max-w-full cursor-default rounded-lg object-contain shadow-immersive"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
