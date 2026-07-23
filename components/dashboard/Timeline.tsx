import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { StepState, TimelineStep } from "@/lib/types";

const DOT_STYLE: Record<StepState, string> = {
  done: "bg-green border-green text-white",
  current: "bg-green-soft border-green text-green",
  todo: "bg-white border-line text-ash",
};

const LABEL_STYLE: Record<StepState, string> = {
  done: "text-ink",
  current: "text-ink",
  todo: "text-ash",
};

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="overflow-x-auto px-7 pb-8 pt-9">
      <ol className="relative flex min-w-[440px] items-start">
        {steps.map((step, index) => {
          const previous = steps[index - 1];
          const isLinkReached = step.state === "done" || previous?.state === "done";

          return (
            <li
              key={step.id}
              aria-current={step.state === "current" ? "step" : undefined}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[-50%] top-[17px] z-0 h-[3px] w-full",
                    isLinkReached ? "bg-green" : "bg-line",
                  )}
                />
              )}

              <span
                className={cn(
                  "z-[1] flex h-9 w-9 items-center justify-center rounded-full border-2 text-[13px] font-bold",
                  DOT_STYLE[step.state],
                )}
              >
                {step.state === "done" ? (
                  <Check size={16} strokeWidth={2.2} aria-hidden />
                ) : (
                  index + 1
                )}
              </span>

              <span className={cn("mt-3 text-[13px] font-bold tracking-tight", LABEL_STYLE[step.state])}>
                {step.title}
              </span>
              <span className="mt-1 text-[10.5px] text-ash">{step.date}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
