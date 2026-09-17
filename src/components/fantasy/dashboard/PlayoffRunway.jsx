const BADGES = {
  Tough: "bg-rose-400/15 text-rose-300 border-rose-400/40",
  Even: "bg-slate-400/15 text-slate-300 border-slate-400/40",
  Favorable: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
};

export default function PlayoffRunway({ playoff, leagueAvgPoints }) {
  const weeks = playoff || [];
  const badgeFor = avg =>
    avg > (leagueAvgPoints || 0) + 5 ? "Tough" : avg < (leagueAvgPoints || 0) - 5 ? "Favorable" : "Even";

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-white/80">Playoff runway</h2>
      {weeks.length === 0 ? (
        <p className="text-xs text-white/50">Playoff-week schedule data isn't out yet.</p>
      ) : (
        <div className="space-y-2">
          {weeks.map(w => {
            const badge = badgeFor(w.opponent.avgPoints);
            return (
              <div key={w.week} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <span className="shrink-0 text-[11px] font-semibold text-white/60">Wk {w.week}</span>
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-xs font-semibold text-white">{w.opponent.name}</p>
                  <p className="text-[10px] text-white/45">
                    {w.opponent.wins}-{w.opponent.losses} · {w.opponent.avgPoints} pts/gm
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${BADGES[badge]}`}>
                  {badge}
                </span>
              </div>
            );
          })}
          <p className="text-[10px] text-white/40">Strength vs league average of {leagueAvgPoints ?? "—"} pts/gm.</p>
        </div>
      )}
    </section>
  );
}