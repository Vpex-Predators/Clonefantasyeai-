import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  DEFAULT_LEAGUE_ID, fetchLeagueCurrent,
  parseTeamSummary, parseTeamRoster, leaguePeriods
} from '../../shared/espnLeague.js';
import { computeThreatBoard } from '../../shared/playoffOdds.js';

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
    trend: p.trend
  };
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { league, season } = await fetchLeagueCurrent(['mNav', 'mTeam', 'mRoster', 'mScoreboard']);
    const leagueName = (league.settings && league.settings.name) || 'ESPN League';
    const { currentPeriod, regSeasonPeriods } = leaguePeriods(league);
    const rawTeams = league.teams || [];
    const teams = rawTeams.map(parseTeamSummary);
    const schedule = league.schedule || [];
    const gamesPlayed = Math.max(1, currentPeriod - 1);

    const locks = await base44.asServiceRole.entities.TeamLock.filter({ user_id: user.id, league_id: DEFAULT_LEAGUE_ID });
    const lock = locks[0] || null;

    // Not locked yet — the War Room shows the same lock gate as the briefing.
    if (!lock) {
      return Response.json({
        locked: false,
        league: { id: DEFAULT_LEAGUE_ID, name: leagueName, season, week: currentPeriod },
        teams: teams.map(t => ({ id: t.id, name: t.name, wins: t.wins, losses: t.losses }))
      });
    }

    const mySummary = teams.find(t => t.id === String(lock.team_id));
    if (!mySummary) return Response.json({ error: 'Your locked team is no longer in this league. Ask the admin to fix your pick.' }, { status: 400 });

    const threatBoard = computeThreatBoard({
      teams, schedule, currentPeriod, regSeasonPeriods,
      myTeamId: mySummary.id, gamesPlayed
    });

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
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}