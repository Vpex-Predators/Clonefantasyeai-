import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { DEFAULT_LEAGUE_ID, defaultSeason, fetchLeague } from '../../shared/espnLeague.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const teamId = String(body.team_id || '').trim();
    const espnEmail = String(body.espn_email || '').trim();
    const birthday = String(body.birthday || '').trim();

    if (!teamId) return Response.json({ error: 'Pick a team first.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(espnEmail)) {
      return Response.json({ error: 'Enter the ESPN email you use for this league.' }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return Response.json({ error: 'Enter your birthday (YYYY-MM-DD).' }, { status: 400 });
    }

    // One locked pick per account — enforced server-side, records are only
    // writable through the service role, so users cannot tamper with locks.
    const existing = await base44.asServiceRole.entities.TeamLock.filter({ user_id: user.id, league_id: DEFAULT_LEAGUE_ID });
    if (existing.length > 0) {
      return Response.json({ error: 'Your team is already locked — one pick per account. Ask the admin if it needs fixing.' }, { status: 409 });
    }

    const season = defaultSeason();
    const league = await fetchLeague(season, DEFAULT_LEAGUE_ID, ['mTeam']);
    const rawTeam = (league.teams || []).find(t => String(t.id) === teamId);
    if (!rawTeam) return Response.json({ error: 'That team is not in this league.' }, { status: 400 });
    const teamName = [rawTeam.location, rawTeam.nickname].filter(Boolean).join(' ') || `Team ${teamId}`;

    await base44.asServiceRole.entities.TeamLock.create({
      user_id: user.id,
      league_id: DEFAULT_LEAGUE_ID,
      team_id: teamId,
      team_name: teamName,
      espn_email: espnEmail,
      birthday
    });

    return Response.json({ lock: { team_id: teamId, team_name: teamName } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}