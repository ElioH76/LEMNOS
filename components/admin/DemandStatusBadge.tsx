import { cn } from "@/lib/cn";
import { STATUS_LABEL, STATUS_STYLE, type DemandStatus } from "@/lib/demands/types";

export function DemandStatusBadge({ status }: { status: DemandStatus }) {
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
