import { FileText, File as FileIcon } from "lucide-react";
import { blobDisplaySrc } from "@/lib/blob/url";
import { isImageType } from "@/lib/media/types";
import { cn } from "@/lib/cn";

/**
 * Vignette d'un média. Les images passent par le proxy Blob authentifié
 * (`blobDisplaySrc`) ; les autres types affichent une icône selon le format.
 */
export function MediaThumb({
  url,
  contentType,
  className,
}: {
  url: string;
  contentType: string;
  className?: string;
}) {
  if (isImageType(contentType)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={blobDisplaySrc(url)}
        alt=""
        className={cn("h-full w-full object-cover", className)}
        loading="lazy"
      />
    );
  }

  const isPdf = contentType === "application/pdf";
  const Icon = isPdf ? FileText : FileIcon;
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-1.5 bg-paper", className)}>
      <Icon size={26} strokeWidth={1.6} className="text-ash" aria-hidden />
      <span className="text-[10px] font-semibold uppercase tracking-caps text-ash">
        {isPdf ? "PDF" : "Fichier"}
      </span>
    </div>
  );
}
