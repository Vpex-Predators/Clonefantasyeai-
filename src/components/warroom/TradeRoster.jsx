import React from "react";
import { cn } from "@/lib/utils";
import HudPanel from "@/components/hud/HudPanel";

// One team's roster as a tap-to-select asset list for the trade builder.
export default function TradeRoster({ title, players, selected, onToggle, selectedLabel, tone }) {
  const selCls = tone === "rose" ? "border-rose-400/60 bg-rose-400/10" : "border-emerald-400/60 bg-emerald-400/10";
  const selTag = tone === "rose" ? "text-rose-300" : "text-emerald-300";

  return (
    <HudPanel label={title} right={`${players.length} ASSETS`}>
      <div className="max-h-60 space-y-1 overflow-y-auto pr-0.5">
        {players.map((p) => {
          const isSel = selected.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={cn(
                "flex w-full items-center gap-2 border px-2 py-1.5 text-left transition-colors",
                isSel ? selCls : "border-white/5 bg-white/[0.02] hover:border-white/20"
              )}
            >
              <span className="w-8 shrink-0 font-mono text-[9px] text-white/45">{p.position}</span>
              <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white/85">{p.name}</span>
              {p.injuryStatus && p.injuryStatus !== "ACTIVE" && (
                <span className="shrink-0 font-mono text-[9px] text-rose-300">{p.injuryStatus.slice(0, 3)}</span>
              )}
              <span className="shrink-0 font-mono text-[10px] text-white/60">{p.weeklyProj}</span>
              {isSel && (
                <span className={cn("shrink-0 font-mono text-[9px] font-bold", selTag)}>{selectedLabel}</span>
              )}
            </button>
          );
        })}
        {!players.length && <p className="py-2 text-center font-mono text-[10px] text-white/40">No roster data.</p>}
      </div>
    </HudPanel>
  );
}