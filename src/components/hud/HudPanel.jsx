import React from "react";
import { cn } from "@/lib/utils";

// Frosted-glass HUD panel — the base container of the command design system.
export default function HudPanel({ label, right, children, className }) {
  return (
    <section
      className={cn(
        "relative animate-fade-up overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        className
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
      {label && (
        <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <h2 className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">{label}</h2>
          {right && <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-300/70">{right}</span>}
        </header>
      )}
      <div className="p-3.5">{children}</div>
    </section>
  );
}