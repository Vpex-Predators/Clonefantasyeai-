import React from "react";
import { Activity, ShieldCheck, Swords, Crown } from "lucide-react";

function Tile({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/45">
        <Icon className="h-3.5 w-3.5" />{label}
      </p>
      <p className={`mt-1.5 font-heading text-2xl font-bold leading-tight ${accent || "text-white"}`}>{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-white/45">{sub}</p>
    </div>
  );
}

export default function MissionStats({ data }) {
  const { myTeam, opponent, playoffOdds } = data;
  const mine = playoffOdds && playoffOdds.mine;
  const playoffPct = mine ? mine.playoffPct : null;
  const wp = mine && mine.currentWeekWinProb != null ? mine.currentWeekWinProb : null;
  const wpTone = wp == null ? "text-white" : wp >= 60 ? "text-emerald-300" : wp <= 40 ? "text-rose-300" : "text-amber-300";
  const playoffTone =
    playoffPct == null ? "text-white"
    : playoffPct >= 60 ? "text-emerald-300"
    : playoffPct <= 35 ? "text-rose-300"
    : "text-amber-300";

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Tile
        icon={Activity}
        label="Record"
        value={`${myTeam.wins}-${myTeam.losses}`}
        sub={`${myTeam.pointsFor} pts for`}
      />
      <Tile
        icon={ShieldCheck}
        label="Playoff odds"
        value={playoffPct == null ? "—" : `${playoffPct}%`}
        sub="1,000 season sims"
        accent={playoffTone}
      />
      <Tile
        icon={Swords}
        label="This week"
        value={opponent ? (wp == null ? "—" : `${wp}%`) : "Bye"}
        sub={opponent ? `vs ${opponent.name} (${opponent.wins}-${opponent.losses})` : "no matchup"}
        accent={wpTone}
      />
      <Tile
        icon={Crown}
        label="Title odds"
        value={mine ? `${mine.titlePct}%` : "—"}
        sub={mine ? `likely seed #${mine.likelySeed}` : ""}
      />
    </div>
  );
}