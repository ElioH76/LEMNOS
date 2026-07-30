import { cn } from "@/lib/cn";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLE, type OrderStatus } from "@/lib/orders/types";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-pill px-3 py-1 text-[11px] font-semibold tracking-link",
        ORDER_STATUS_STYLE[status],
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
