import { Loader2, Sparkles } from "lucide-react";

function positionRows(mine, theirs) {
  const keys = [...new Set([...mine.map(p => p.position), ...(theirs || []).map(p => p.position)])];
  return keys.map(pos => {
    const best = list => (list || []).filter(p => p.position === pos).reduce((m, p) => Math.max(m, p.weeklyProj || 0), 0);
    return { position: pos, mine: best(mine), theirs: best(theirs) };
  });
}

export default function MatchupEngine({ myTeam, opponent, opponentStarters, matchup, week, analyzing, onAnalyze, pending, onSeen }) {
  const rows = positionRows(myTeam.starters || [], opponentStarters || []);
  const myTotal = parseFloat((myTeam.starters || []).reduce((s, p) => s + (p.weeklyProj || 0), 0).toFixed(1));
  const oppTotal = parseFloat((opponentStarters || []).reduce((s, p) => s + (p.weeklyProj || 0), 0).toFixed(1));
  const myPct = Math.round((myTotal / Math.max(myTotal + oppTotal, 1)) * 100);
  const ai = matchup?.matchup;
  const oppPending = opponent && (pending || []).includes("opp:" + opponent.id);

  return (
    <section
      onClick={() => { if (oppPending) onSeen(["opp:" + opponent.id]); }}
      className={`relative rounded-2xl border p-4 transition-all ${
        oppPending
          ? "border-emerald-400/60 bg-emerald-400/5 shadow-[0_0_22px_rgba(52,211,153,0.22)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      {oppPending && (
        <span className="absolute -top-2 right-4 animate-pulse rounded-full bg-emerald-400 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
          NEW
        </span>
      )}
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-white/80">Week {week} matchup</h2>
        <span className="text-[10px] text-white/40">{myTotal} vs {oppTotal} proj</span>
      </div>

      {!opponent ? (
        <p className="text-xs text-white/50">No matchup this week (bye).</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
            <span className="max-w-[42%] truncate text-emerald-300">{myTeam.name}</span>
            <span className="shrink-0 text-[10px] font-normal text-white/40">{myTeam.wins}-{myTeam.losses} · {opponent.wins}-{opponent.losses}</span>
            <span className="max-w-[42%] truncate text-right text-rose-300">{opponent.name}</span>
          </div>

          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="bg-emerald-400" style={{ width: myPct + "%" }} />
            <div className="flex-1 bg-rose-400/70" />
          </div>

          <div className="mt-3 space-y-1">
            {rows.map(r => {
              const mineWins = r.mine >= r.theirs;
              return (
                <div key={r.position} className="flex items-center gap-1 text-[11px]">
                  <span className={`w-9 shrink-0 text-left ${mineWins ? "font-semibold text-emerald-300" : "text-white/60"}`}>
                    {r.mine}
                  </span>
                  <span className="flex-1 text-center text-white/40">{r.position}</span>
                  <span className={`w-9 shrink-0 text-right ${!mineWins ? "font-semibold text-rose-300" : "text-white/60"}`}>
                    {r.theirs}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t border-white/10 pt-3">
            {ai ? (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-white/80">
                  Upper hand: <span className="text-emerald-300">{ai.upper_hand}</span>
                  {ai.win_probability != null && (
                    <span className="ml-2 font-normal text-white/50">· your win prob {Math.round(ai.win_probability)}%</span>
                  )}
                </p>
                <ul className="space-y-1">
                  {(ai.reasons || []).map((r, i) => (
                    <li key={i} className="text-[11px] text-white/60">• {r}</li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase text-emerald-400/80">Your levers</p>
                    {(ai.user_levers || []).map((l, i) => (
                      <p key={i} className="text-[10px] text-white/55">{l}</p>
                    ))}
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase text-rose-400/80">Their levers</p>
                    {(ai.opponent_levers || []).map((l, i) => (
                      <p key={i} className="text-[10px] text-white/55">{l}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); onAnalyze(); }}
                disabled={analyzing}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-60"
              >
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {analyzing ? "Comparing lineups…" : "Who has the upper hand? Run the comparison"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}