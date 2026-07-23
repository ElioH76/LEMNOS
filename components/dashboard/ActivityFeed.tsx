"use client";

import { cn } from "@/lib/cn";
import { useDashboard } from "./DashboardProvider";

export function ActivityFeed() {
  const { activity } = useDashboard();

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <h2 className="mb-5 text-[16px] font-bold tracking-tight">Activité récente</h2>

      <ol className="flex flex-col">
        {activity.map((item, index) => {
          const isLast = index === activity.length - 1;

          return (
            <li key={item.id} className="flex gap-3.5 pb-5 last:pb-0">
              <div className="flex flex-none flex-col items-center">
                <span
                  aria-hidden
                  className={cn(
                    "mt-[5px] h-2.5 w-2.5 rounded-full",
                    item.highlight ? "bg-green" : "bg-line",
                  )}
                />
                {!isLast && <span aria-hidden className="mt-1 w-0.5 flex-1 bg-line-soft" />}
              </div>
              <div className="pb-0.5">
                <div className="text-[14px] leading-[1.45] text-slate">{item.text}</div>
                <div className="mt-1 text-[11px] text-ash">{item.time}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
