import { cn } from "@/lib/cn";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/theme";
import type { ProjectStatus } from "@/lib/types";

/** Badge entièrement piloté par le statut réel du projet. */
export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-pill px-3 py-1 text-[11px] font-semibold tracking-link",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
