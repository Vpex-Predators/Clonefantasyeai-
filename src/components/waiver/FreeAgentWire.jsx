import React, { useMemo, useState } from "react";
import HudPanel from "@/components/hud/HudPanel";

const POSITIONS = ["All", "QB", "RB", "WR", "TE", "D/ST", "K"];
const label = (position) => position === "DST" ? "D/ST" : position;

export default function FreeAgentWire({ players = [] }) {
  const [position, setPosition] = useState("All");
  const visible = useMemo(() => players
    .filter((player) => position === "All" || label(player.position) === position)
    .sort((a, b) => (b.weeklyProj || 0) - (a.weeklyProj || 0)), [players, position]);

  return (
    <HudPanel label="Full free-agent wire" right={`${visible.length} AVAILABLE`}>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {POSITIONS.map((pos) => (
          <button key={pos} onClick={() => setPosition(pos)} className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${position === pos ? "bg-emerald-400 text-slate-950" : "border border-white/10 bg-white/5 text-white/50"}`}>
            {pos}
          </button>
        ))}
      </div>
      <div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
        {visible.map((player, index) => (
          <div key={player.id} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-2 border border-white/10 bg-white/[0.035] px-2.5 py-2">
            <span className="font-mono text-[9px] text-white/25">{index + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white/85">{player.name}</p>
              <p className="font-mono text-[9px] uppercase text-white/35">{label(player.position)} · {player.percentOwned || 0}% owned</p>
            </div>
            <div className="text-right font-mono text-[9px] uppercase text-white/45">
              <p><span className="text-emerald-300">{player.weeklyProj || 0}</span> wk</p>
              <p><span className="text-white/75">{player.seasonProj || 0}</span> ROS</p>
            </div>
          </div>
        ))}
        {!visible.length && <p className="py-6 text-center text-xs text-white/45">No available players at this position.</p>}
      </div>
    </HudPanel>
  );
}