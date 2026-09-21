import React from "react";
import HudPanel from "@/components/hud/HudPanel";
import PulseTotals from "@/components/fantasy/dashboard/PulseTotals";
import PulseLeaderboard from "@/components/fantasy/dashboard/PulseLeaderboard";
import PulseMoveFeed from "@/components/fantasy/dashboard/PulseMoveFeed";
import CollusionRadar from "@/components/fantasy/dashboard/CollusionRadar";

// League Pulse: the whole league's season totals, other managers' recent
// moves, and the pattern-detector collusion radar — one HUD panel.
export default function LeaguePulse({ pulse, teams, myTeam }) {
  if (!pulse) return null;
  return (
    <HudPanel label="League pulse" right="SEASON SCAN">
      <div className="space-y-3.5">
        <PulseTotals totals={pulse.totals} myTeam={myTeam} />
        <PulseLeaderboard teams={teams || []} myTeamId={myTeam?.id} />
        <PulseMoveFeed moves={pulse.moves || []} available={pulse.movesAvailable !== false} />
        <CollusionRadar flags={pulse.flags || []} />
      </div>
    </HudPanel>
  );
}