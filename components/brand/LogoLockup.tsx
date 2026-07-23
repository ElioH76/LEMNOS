import { cn } from "@/lib/cn";
import { Mark } from "./Mark";

/**
 * Mark + wordmark « LEMNOS ». Le wordmark est toujours en capitales très
 * espacées (nav 0.22em, header 0.16em).
 */
export function LogoLockup({
  markClassName = "w-[26px]",
  wordmarkClassName,
  tracking = "wordmark",
  className,
}: {
  markClassName?: string;
  wordmarkClassName?: string;
  tracking?: "brand" | "wordmark";
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Mark className={markClassName} />
      <span
        className={cn(
          "font-extrabold uppercase",
          tracking === "brand" ? "tracking-brand" : "tracking-wordmark",
          wordmarkClassName,
        )}
      >
        Lemnos
      </span>
    </span>
  );
}
