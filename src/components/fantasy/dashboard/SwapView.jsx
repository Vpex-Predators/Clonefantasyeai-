import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import InjuryBadge from "./InjuryBadge";

// Which real positions can fill each lineup slot (ESPN slot ids).
const SLOT_ELIGIBLE = {
  0: ["QB"], 2: ["RB"], 3: ["RB", "WR"], 4: ["WR"], 5: ["WR", "TE"],
  6: ["TE"], 7: ["QB", "RB", "WR", "TE"], 16: ["DST"], 17: ["K"], 23: ["RB", "WR", "TE"]
};
const label = pos => (pos === "DST" ? "D/ST" : pos || "—");

// Starters vs bench, side by side, with swap suggestions where a bench player
// projects higher at a compatible slot.
export default function SwapView({ starters = [], bench = [] }) {
  const { swaps, swapByBench, swapByStarter } = useMemo(() => {
    const taken = new Set();
    const found = [];
    // Weakest starters pick first so upgrades land where they help most.
    const ordered = [...starters].sort((x, y) => (x.weeklyProj || 0) - (y.weeklyProj || 0));
    for (const s of ordered) {
      const allowed = SLOT_ELIGIBLE[s.slot] || [s.realPosition || s.position];
      const best = bench
        .filter(b => allowed.includes(b.realPosition || b.position) && !taken.has(b.id))
        .filter(b => (b.weeklyProj || 0) > (s.weeklyProj || 0))
        .sort((x, y) => (y.weeklyProj || 0) - (x.weeklyProj || 0))[0];
      if (best) {
        taken.add(best.id);
        found.push({ starter: s, bench: best, margin: (best.weeklyProj - s.weeklyProj).toFixed(1) });
      }
    }
    const byBench = {};
    const byStarter = {};
    found.forEach(sw => { byBench[sw.bench.id] = sw; byStarter[sw.starter.id] = sw; });
    return { swaps: found, swapByBench: byBench, swapByStarter: byStarter };
  }, [starters, bench]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">Swap check</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-white/70">
          ESPN week projections, starters vs bench. Tap a suggestion for the full side-by-side breakdown.
        </p>
        {swaps.length > 0 ? (
          <div className="mt-2.5 space-y-1.5">
            {swaps.map(sw => (
              <Link
                key={`${sw.starter.id}-${sw.bench.id}`}
                to={`/warroom?compare=${sw.bench.id},${sw.starter.id}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 transition-colors hover:bg-emerald-400/20"
              >
                <span className="min-w-0 truncate text-[11px] font-semibold text-emerald-200">
                  Start {sw.bench.name} over {sw.starter.name}
                </span>
                <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold text-emerald-300">
                  <TrendingUp className="h-3 w-3" /> +{sw.margin} pts
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/80">
            No bench player projects higher than your starters at any compatible slot this week — your lineup is set as-is.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[{ title: "Starters", list: starters }, { title: "Bench", list: bench }].map(col => (
          <div key={col.title} className="space-y-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/70">{col.title}</h3>
            {col.list.map(p => {
              const sw = col.title === "Starters" ? swapByStarter[p.id] : swapByBench[p.id];
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border px-2.5 py-2 ${sw ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/5"}`}
                >
                  <p className="truncate text-[11px] font-semibold text-white">{p.name}</p>
                  <div className="mt-0.5 flex items-center justify-between gap-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/70">{label(p.realPosition || p.position)}</span>
                    <span className="font-mono text-[10px] text-white/80">{p.weeklyProj != null ? p.weeklyProj.toFixed(1) : "—"} wk</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <InjuryBadge status={p.injuryStatus} />
                    {sw && (
                      <span className="font-mono text-[9px] font-bold text-emerald-300">
                        {col.title === "Starters" ? `bench upgrade +${sw.margin}` : `over ${sw.starter.name.split(" ").slice(-1)[0]} +${sw.margin}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}