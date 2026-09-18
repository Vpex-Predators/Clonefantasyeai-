import React from "react";
import { Radar } from "lucide-react";

// Sticky HUD status bar shared by the briefing and the war room.
export default function HudStatusBar({ title, sub, tag = "LIVE" }) {
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 backdrop-blur-2xl">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Radar className="h-4 w-4 shrink-0 text-emerald-400" />
          <div className="min-w-0">
            <h1 className="truncate font-heading text-xs font-bold uppercase tracking-[0.22em] text-white">{title}</h1>
            {sub && (
              <p className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">{sub}</p>
            )}
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {tag}
        </span>
      </div>
    </div>
  );
}