import React from "react";
import { Link } from "react-router-dom";
import HudPanel from "@/components/hud/HudPanel";
import OpenButton from "@/components/hud/OpenButton";

// War room doorway: the opponent's highest-projected starter is the week's
// biggest threat. A tap opens the threat board, rankings, and sims.
export default function WarRoomCard({ data, delay = 0 }) {
  const { opponent, opponentStarters = [] } = data;
  const threat = [...opponentStarters]
    .sort((a, b) => (b.weeklyProj || 0) - (a.weeklyProj || 0))[0] || null;

  return (
    <Link to="/warroom" className="no-callout block rounded-2xl transition-transform duration-200 active:scale-[0.99]">
      <HudPanel
        label="War room"
        right={opponent ? `VS ${opponent.wins}-${opponent.losses}` : "THREATS"}
        delay={delay}
        compact
      >
        {threat ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Biggest threat this week</p>
            <div className="mt-1.5 rounded-lg border border-rose-400/25 bg-rose-400/10 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] font-bold text-white">
                  {threat.name}{" "}
                  <span className="font-normal text-white/45">({threat.realPosition || threat.position})</span>
                </span>
                <span className="shrink-0 font-mono text-[11px] font-bold text-rose-300">
                  {threat.weeklyProj != null ? `${threat.weeklyProj} proj` : "—"}
                </span>
              </div>
              {opponent && (
                <p className="mt-0.5 text-[10px] text-white/55">
                  Top projected starter for {opponent.name}.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-white/55">
            {opponent ? "No opponent projections posted yet." : "BYE week — scout the wire and the trade market."}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] text-white/55">
          <span className="min-w-0">Threat board · power rankings · trade sims</span>
          <OpenButton>Open war room</OpenButton>
        </div>
      </HudPanel>
    </Link>
  );
}