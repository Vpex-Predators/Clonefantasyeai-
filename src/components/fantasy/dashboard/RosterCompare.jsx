import PlayerCard from "./PlayerCard";

export default function RosterCompare({ starters, bench, pending, onSeen, onAnalyze, analyzing }) {
  const pendingSet = new Set(pending || []);
  const starterProj = starters.reduce((s, p) => s + (p.weeklyProj || 0), 0).toFixed(1);
  const benchProj = bench.reduce((s, p) => s + (p.weeklyProj || 0), 0).toFixed(1);

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">Lineup vs Bench</h2>
        <span className="text-[10px] text-white/40">Starters {starterProj} · Bench {benchProj} proj</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">Starters</p>
          {starters.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              pending={pendingSet.has("p:" + p.id)}
              analyzing={analyzing}
              onOpen={onSeen}
              onAnalyze={onAnalyze}
            />
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">Bench</p>
          {bench.map(p => (
            <PlayerCard
              key={p.id}
              player={p}
              pending={pendingSet.has("p:" + p.id)}
              analyzing={analyzing}
              onOpen={onSeen}
              onAnalyze={onAnalyze}
            />
          ))}
          {bench.length === 0 && <p className="text-[11px] text-white/40">No bench players.</p>}
        </div>
      </div>
    </section>
  );
}