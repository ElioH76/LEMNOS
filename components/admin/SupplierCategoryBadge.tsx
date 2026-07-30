import { cn } from "@/lib/cn";
import {
  SUPPLIER_CATEGORY_LABEL,
  SUPPLIER_CATEGORY_STYLE,
  type SupplierCategory,
} from "@/lib/suppliers/types";

export function SupplierCategoryBadge({ category }: { category: SupplierCategory }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-pill px-2.5 py-0.5 text-[10.5px] font-semibold tracking-link",
        SUPPLIER_CATEGORY_STYLE[category],
      )}
    >
      {SUPPLIER_CATEGORY_LABEL[category]}
    </span>
  );
}
