import React from "react";

export default function LeaguePulse({ data }) {
  const { myTeam, playoffOdds } = data;
  const race = (playoffOdds && playoffOdds.race) || [];
  if (!race.length) return null;
  const cutoff = (playoffOdds && playoffOdds.playoffTeamCount) || 6;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-white/80">
        League pulse — playoff race
      </h2>
      <div className="space-y-1.5">
        {race.map((t, i) => {
          const mine = t.id === myTeam.id;
          const inField = i < cutoff;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                mine ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/5 bg-white/[0.03]"
              }`}
            >
              <span className={`w-4 text-center text-[10px] font-bold ${inField ? "text-emerald-300" : "text-white/35"}`}>
                {i + 1}
              </span>
              <span className={`min-w-0 flex-1 truncate text-xs font-semibold ${mine ? "text-emerald-200" : "text-white/85"}`}>
                {t.name}
              </span>
              <span className="text-[10px] tabular-nums text-white/45">
                {t.wins}-{t.losses}
              </span>
              <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${
                    t.playoffPct >= 60 ? "bg-emerald-400" : t.playoffPct >= 35 ? "bg-amber-400" : "bg-rose-400"
                  }`}
                  style={{ width: `${t.playoffPct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-[10px] font-bold tabular-nums text-white/70">
                {t.playoffPct}%
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-white/40">
        Top {cutoff} make the playoffs · % = simulated playoff odds.
      </p>
    </section>
  );
}