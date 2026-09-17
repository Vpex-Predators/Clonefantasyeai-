import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

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
    const season = Number(body.season) || defaultSeason();

    if (!/^\d{1,10}$/.test(leagueId)) {
      return Response.json({ error: 'Enter a valid ESPN league ID (numbers only).' }, { status: 400 });
    }

    // Cookies live only in backend secrets — never in the request or the database
    const espnS2 = secrets.get('ESPN_S2');
    const swid = secrets.get('ESPN_SWID');
    if (!espnS2 || !swid) {
      return Response.json(
        { error: 'ESPN cookies are not configured on the server. Add the ESPN_S2 and ESPN_SWID secrets in your app settings and try again.' },
        { status: 500 }
      );
    }

    // site.api.espn.com rejects requests from the app's servers, so we use
    // ESPN's league-manager API, which accepts them.
    const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam`;
    const espnRes = await fetch(url, {
      headers: {
        Cookie: `espn_s2=${espnS2}; SWID=${swid}`,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://fantasy.espn.com/'
      }
    });

    if (!espnRes.ok) {
      let msg = `ESPN returned an error (${espnRes.status}).`;
      if (espnRes.status === 401 || espnRes.status === 403) {
        msg = 'ESPN rejected the stored cookies. Refresh the ESPN_S2 and ESPN_SWID secrets with fresh values from fantasy.espn.com and try again.';
      } else if (espnRes.status === 404) {
        msg = 'League not found. Double-check the league ID and season year.';
      }
      return Response.json({ error: msg }, { status: 400 });
    }

    const data = await espnRes.json();
    const league = (data.leagues && data.leagues[0]) || (data.settings ? data : null);
    if (!league) {
      return Response.json({ error: 'ESPN responded, but no league data was returned. Verify the league ID and season year.' }, { status: 400 });
    }

    const leagueName = (league.settings && league.settings.name) || 'ESPN League';
    const rawTeams = data.teams || league.teams || [];
    const teams = rawTeams.map((t) => ({
      id: t.id,
      name: [t.location, t.nickname].filter(Boolean).join(' ') || t.name || `Team ${t.id}`
    }));

    if (teams.length === 0) {
      return Response.json({ error: 'ESPN responded, but the league data was empty. Verify the league ID and that the stored cookies are still valid.' }, { status: 400 });
    }

    // Save or update this user's league record — cookies are never stored here
    const existing = await base44.entities.EspnLeague.filter({ league_id: leagueId, created_by_id: user.id });
    const record = { league_id: leagueId, season, league_name: leagueName };
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