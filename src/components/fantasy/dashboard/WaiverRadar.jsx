export default function WaiverRadar({ freeAgents, bench }) {
  const weakest = (bench || [])
    .slice()
    .sort((a, b) => (a.weeklyProj || 0) - (b.weeklyProj || 0) || (a.seasonAvg || 0) - (b.seasonAvg || 0))[0];
  const top = (freeAgents || []).slice(0, 5);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-white/80">Waiver radar</h2>
      {top.length === 0 ? (
        <p className="text-xs text-white/50">Free-agent data isn't available right now — refresh again in a bit.</p>
      ) : !weakest ? (
        <p className="text-xs text-white/50">Add bench players to see waiver comparisons.</p>
      ) : (
        <div className="space-y-2">
          {top.map(fa => {
            const delta = (fa.weeklyProj || 0) - (weakest.weeklyProj || 0);
            const worth = delta >= 2;
            return (
              <div key={fa.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {fa.name} <span className="text-white/40">· {fa.position}</span>
                  </p>
                  <p className="text-[10px] text-white/45">
                    proj {fa.weeklyProj || 0} wk · {fa.seasonProj || 0} ROS
                    {fa.injuryStatus !== "ACTIVE" ? ` · ${fa.injuryStatus}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-[11px] font-bold ${worth ? "text-emerald-300" : "text-white/40"}`}>
                    {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                  </p>
                  {worth && (
                    <p className="text-[9px] text-white/50">
                      add · drop {weakest.name.split(" ").slice(-1)[0]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-[10px] text-white/40">
            Deltas compare each free agent's weekly projection against your weakest bench player ({weakest.name}).
          </p>
        </div>
      )}
    </section>
  );
}