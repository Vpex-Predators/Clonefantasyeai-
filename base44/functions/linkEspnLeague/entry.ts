import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { fetchLeague, fetchLeagueCurrent, parseTeamSummary } from '../../shared/espnLeague.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const leagueId = String(body.league_id || '').trim();
    if (!/^\d{1,10}$/.test(leagueId)) {
      return Response.json({ error: 'Enter a valid ESPN league ID (numbers only).' }, { status: 400 });
    }

    // League fetching and response parsing live in the shared module — the same
    // code path the dashboard uses, so ESPN response-shape changes (like the
    // 2026 top-level format) are handled in one place.
    // Cookies live only in backend secrets — never in the request or the database.
    const views = ['mSettings', 'mTeam'];
    let league;
    let season;
    if (body.season) {
      season = Number(body.season);
      league = await fetchLeague(season, leagueId, views);
    } else {
      ({ league, season } = await fetchLeagueCurrent(views, leagueId));
    }

    const leagueName = (league.settings && league.settings.name) || 'ESPN League';
    const teams = (league.teams || []).map(parseTeamSummary).map(t => ({ id: t.id, name: t.name }));
    if (teams.length === 0) {
      return Response.json({ error: 'ESPN responded, but the league data was empty. Verify the league ID and that the stored cookies are still valid.' }, { status: 400 });
    }

    // Save or update this user's league record — cookies are never stored here
    const existing = await base44.entities.EspnLeague.filter({ league_id: leagueId, created_by_id: user.id });
    const record = { league_id: leagueId, season, league_name: leagueName };
    if (existing.length > 0) await base44.entities.EspnLeague.update(existing[0].id, record);
    else await base44.entities.EspnLeague.create(record);

    return Response.json({ league: { id: leagueId, name: leagueName, season }, teams });
  } catch (error) {
    const status = error && error.status === 404 ? 400 : 500;
    return Response.json({ error: error.message }, { status });
  }
}