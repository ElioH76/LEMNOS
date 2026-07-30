import { cn } from "@/lib/cn";
import { MEDIA_KIND_LABEL, MEDIA_KIND_STYLE, type MediaKind } from "@/lib/media/types";

export function MediaKindBadge({ kind }: { kind: MediaKind }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-pill px-2.5 py-0.5 text-[10.5px] font-semibold tracking-link",
        MEDIA_KIND_STYLE[kind],
      )}
    >
      {MEDIA_KIND_LABEL[kind]}
    </span>
  );
}
