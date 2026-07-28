import { cn } from "@/lib/cn";
import { INVOICE_STATUS_LABEL, INVOICE_STATUS_STYLE, type InvoiceStatus } from "@/lib/billing/types";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-pill px-3 py-1 text-[11px] font-semibold tracking-link",
        INVOICE_STATUS_STYLE[status],
      )}
    >
      {INVOICE_STATUS_LABEL[status]}
    </span>
  );
}
