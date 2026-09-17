import React from "react";
import HudStat from "@/components/hud/HudStat";

export default function MissionStats({ data }) {
  const { myTeam, opponent, playoffOdds } = data;
  const mine = playoffOdds && playoffOdds.mine;
  const playoffPct = mine ? mine.playoffPct : null;
  const wp = mine && mine.currentWeekWinProb != null ? mine.currentWeekWinProb : null;
  const wpTone = wp == null ? "plain" : wp >= 60 ? "good" : wp <= 40 ? "bad" : "warn";
  const playoffTone =
    playoffPct == null ? "plain"
    : playoffPct >= 60 ? "good"
    : playoffPct <= 35 ? "bad"
    : "warn";

  return (
    <div className="grid grid-cols-2 gap-2">
      <HudStat
        label="Record"
        value={`${myTeam.wins}-${myTeam.losses}`}
        sub={`${myTeam.pointsFor} pts for`}
      />
      <HudStat
        label="Playoff odds"
        value={playoffPct == null ? "—" : `${playoffPct}%`}
        sub={`${playoffOdds ? playoffOdds.sims : "1000"} season sims`}
        tone={playoffTone}
      />
      <HudStat
        label="This week"
        value={opponent ? (wp == null ? "—" : `${wp}%`) : "BYE"}
        sub={opponent ? `vs ${opponent.name}` : "no matchup"}
        tone={wpTone}
      />
      <HudStat
        label="Title odds"
        value={mine ? `${mine.titlePct}%` : "—"}
        sub={mine ? `likely seed #${mine.likelySeed}` : ""}
      />
    </div>
  );
}