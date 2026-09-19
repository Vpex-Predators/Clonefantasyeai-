import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  DEFAULT_LEAGUE_ID, fetchLeagueCurrent, parseTeamRoster, leaguePeriods
} from '../../shared/espnLeague.js';

// Lightweight live-scores refresh: same ESPN views as the dashboard load, so
// within the 60-second shared cache this is a pure cache hit — and it never
// runs AI analysis, playoff sims or analysis reads. Returns only the fields
// the client needs to update live points, projections and injury flags.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [leagueRes, locks] = await Promise.all([
      fetchLeagueCurrent(['mNav', 'mTeam', 'mRoster', 'mScoreboard']),
      base44.asServiceRole.entities.TeamLock.filter({ user_id: user.id, league_id: DEFAULT_LEAGUE_ID })
    ]);
    const { league } = leagueRes;
    const lock = locks[0];
    if (!lock) return Response.json({ error: 'Lock your team on the dashboard first.' }, { status: 400 });

    const { currentPeriod } = leaguePeriods(league);
    const rawTeams = league.teams || [];
    const myRaw = rawTeams.find(t => String(t.id) === String(lock.team_id));
    if (!myRaw) return Response.json({ error: 'Your locked team is no longer in the league.' }, { status: 400 });

    const trim = p => ({ id: p.id, injuryStatus: p.injuryStatus, livePoints: p.livePoints, weeklyProj: p.weeklyProj });
    const mine = parseTeamRoster(myRaw, currentPeriod).map(trim);

    const currentMatchup = (league.schedule || []).find(m =>
      m.matchupPeriodId === currentPeriod &&
      (String((m.home || {}).teamId) === String(lock.team_id) || String((m.away || {}).teamId) === String(lock.team_id))
    );
    let opponent = [];
    if (currentMatchup) {
      const oppId = String(currentMatchup.home.teamId) === String(lock.team_id)
        ? String(currentMatchup.away.teamId)
        : String(currentMatchup.home.teamId);
      const oppRaw = rawTeams.find(t => String(t.id) === oppId);
      if (oppRaw) opponent = parseTeamRoster(oppRaw, currentPeriod).map(trim);
    }

    return Response.json({
      week: currentPeriod,
      mine,
      opponent,
      refreshedAt: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}