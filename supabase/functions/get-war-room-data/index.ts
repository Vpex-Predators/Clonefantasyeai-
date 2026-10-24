import { getAuthenticatedUser, getTeamLocksForUser, corsHeadersFor } from '../_shared/requestAuth.ts';
import {
  DEFAULT_LEAGUE_ID, fetchLeagueCurrent, fetchFreeAgents,
  parseTeamSummary, parseTeamRoster, leaguePeriods
} from '../_shared/espnLeague.js';
import { computeThreatBoard } from '../_shared/playoffOdds.js';

function trimRoster(p) {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    slot: p.slot,
    isStarter: p.isStarter,
    injuryStatus: p.injuryStatus,
    weeklyProj: p.weeklyProj,
    seasonProj: p.seasonProj,
    seasonAvg: p.seasonAvg,
    percentOwned: p.percentOwned,
    trend: p.trend
  };
}

async function runWarRoom(req) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Authorize the user's league BEFORE fetching any private ESPN data.
    const locks = await getTeamLocksForUser(req, user.id, DEFAULT_LEAGUE_ID);
    const lock = locks[0] || null;
    if (!lock) return Response.json({ locked: false });

    const { league, season } = await fetchLeagueCurrent(['mNav', 'mTeam', 'mRoster', 'mScoreboard']);
    const leagueName = (league.settings && league.settings.name) || 'ESPN League';
    const { currentPeriod, regSeasonPeriods } = leaguePeriods(league);
    const rawTeams = league.teams || [];
    const teams = rawTeams.map(parseTeamSummary);
    const schedule = league.schedule || [];
    const gamesPlayed = Math.max(1, currentPeriod - 1);

    const mySummary = teams.find(t => t.id === String(lock.team_id));
    if (!mySummary) return Response.json({ error: 'Your locked team is no longer in this league. Ask the admin to fix your pick.' }, { status: 400 });

    const threatBoard = computeThreatBoard({
      teams, schedule, currentPeriod, regSeasonPeriods,
      myTeamId: mySummary.id, gamesPlayed
    });
    const freeAgents = await fetchFreeAgents(season, DEFAULT_LEAGUE_ID, currentPeriod, 200);

    // Every team's full roster powers the trade simulator.
    const rosters = {};
    for (const raw of rawTeams) {
      rosters[String(raw.id)] = parseTeamRoster(raw, currentPeriod).map(trimRoster);
    }

    return Response.json({
      locked: true,
      league: { id: DEFAULT_LEAGUE_ID, name: leagueName, season, week: currentPeriod },
      myTeam: {
        id: mySummary.id,
        name: mySummary.name,
        wins: mySummary.wins,
        losses: mySummary.losses,
        ties: mySummary.ties,
        pointsFor: mySummary.pointsFor,
        pointsAgainst: mySummary.pointsAgainst
      },
      teams: teams.map(t => ({ id: t.id, name: t.name, wins: t.wins, losses: t.losses, ties: t.ties, pointsFor: t.pointsFor })),
      threatBoard,
      rosters,
      freeAgents: freeAgents.map(trimRoster),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: 'Unable to load War Room data.' }, { status: 503 });
  }
}

// Isolated staging endpoint. Do not route the production site here until cutover tests pass.
Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (cors === null) return Response.json({ error: "Origin not allowed" }, { status: 403 });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: cors });
  const length = Number(req.headers.get("content-length") || 0);
  if (!Number.isFinite(length) || length > 1024) return Response.json({ error: "Request too large" }, { status: 413, headers: cors });
  const response = await runWarRoom(req);
  const headers = new Headers(response.headers);
  Object.entries(cors).forEach(([name, value]) => headers.set(name, value));
  headers.set("Cache-Control", "private, no-store");
  return new Response(response.body, { status: response.status, headers });
});
