import React from "react";
import { cn } from "@/lib/utils";

export default function HudPanel({ label, right, children, className, delay = 0, compact = false }) {
  return (
    <section
      className={cn(
        "app-card relative animate-fade-up overflow-hidden rounded-[1.35rem]",
        className
      )}
      style={delay ? { animationDelay: delay + "ms" } : undefined}
    >
      {label && (
        <header className={cn("flex items-center justify-between gap-3 px-4 pt-4", compact && "pt-3.5")}>
          <h2 className="font-heading text-sm font-semibold tracking-tight text-white/85">{label}</h2>
          {right && <span className="text-sm font-medium text-white/50">{right}</span>}
        </header>
      )}
      <div className={cn(compact ? "p-3.5" : "p-4")}>{children}</div>
    </section>
  );
}
