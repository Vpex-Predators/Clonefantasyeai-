import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

function defaultSeason() {
  const now = new Date();
  // NFL season year: from August onward the new season is underway
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const leagueId = String(body.league_id || '').trim();
    const espnS2 = String(body.espn_s2 || '').trim();
    const swid = String(body.swid || '').trim();
    const season = Number(body.season) || defaultSeason();

    if (!/^\d{1,10}$/.test(leagueId)) {
      return Response.json({ error: 'Enter a valid ESPN league ID (numbers only).' }, { status: 400 });
    }
    if (!espnS2 || !swid) {
      return Response.json({ error: 'Both the espn_s2 and SWID cookies are required.' }, { status: 400 });
    }
    if (espnS2.length > 2000 || swid.length > 2000) {
      return Response.json({ error: 'Those cookie values look invalid (too long).' }, { status: 400 });
    }

    const url = `https://site.api.espn.com/apis/fantasy/v2/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam`;
    const espnRes = await fetch(url, {
      headers: { Cookie: `espn_s2=${espnS2}; SWID=${swid}` }
    });

    if (!espnRes.ok) {
      let msg = `ESPN returned an error (${espnRes.status}).`;
      if (espnRes.status === 401 || espnRes.status === 403) {
        msg = 'ESPN rejected these cookies. Log back into fantasy.espn.com, copy fresh espn_s2 and SWID values, and try again.';
      } else if (espnRes.status === 404) {
        msg = 'League not found. Double-check the league ID and season year.';
      }
      return Response.json({ error: msg }, { status: 400 });
    }

    const data = await espnRes.json();
    const league = (data.leagues && data.leagues[0]) || {};
    const leagueName = (league.settings && league.settings.name) || (data.settings && data.settings.name) || 'ESPN League';
    const rawTeams = data.teams || league.teams || [];
    const teams = rawTeams.map((t) => ({
      id: t.id,
      name: [t.location, t.nickname].filter(Boolean).join(' ') || t.name || `Team ${t.id}`
    }));

    if (!leagueName || teams.length === 0) {
      return Response.json({ error: 'ESPN responded, but the league data was empty. Verify the league ID and that your cookies are still valid.' }, { status: 400 });
    }

    // Save or update this user's connection (one record per league)
    const existing = await base44.entities.EspnLeague.filter({ league_id: leagueId, created_by_id: user.id });
    const record = { league_id: leagueId, espn_s2: espnS2, swid, season, league_name: leagueName };
    if (existing.length > 0) {
      await base44.entities.EspnLeague.update(existing[0].id, record);
    } else {
      await base44.entities.EspnLeague.create(record);
    }

    return Response.json({ league: { id: leagueId, name: leagueName, season }, teams });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}