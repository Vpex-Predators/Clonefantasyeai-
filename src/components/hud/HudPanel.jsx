import React from "react";
import { cn } from "@/lib/utils";

const CORNERS = [
  "-left-px -top-px border-l-2 border-t-2",
  "-right-px -top-px border-r-2 border-t-2",
  "-left-px -bottom-px border-l-2 border-b-2",
  "-right-px -bottom-px border-r-2 border-b-2",
];

// Corner-bracketed HUD panel — the base container of the command design system.
export default function HudPanel({ label, right, children, className }) {
  return (
    <section className={cn("relative border border-white/10 bg-white/[0.04]", className)}>
      {CORNERS.map((c) => (
        <span key={c} aria-hidden="true" className={cn("pointer-events-none absolute h-2.5 w-2.5 border-white/40", c)} />
      ))}
      {label && (
        <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
          <h2 className="font-heading text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">{label}</h2>
          {right && <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/40">{right}</span>}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}