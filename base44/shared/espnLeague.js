import { secrets } from 'base44:runtime';

export const DEFAULT_LEAGUE_ID = '1435304362';

export function defaultSeason() {
  const now = new Date();
  // NFL season year: from August onward the new season is underway
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export async function espnFetch(url) {
  const espnS2 = secrets.get('ESPN_S2');
  const swid = secrets.get('ESPN_SWID');
  if (!espnS2 || !swid) {
    throw new Error('ESPN cookies are not configured on the server (ESPN_S2 / ESPN_SWID secrets).');
  }
  const res = await fetch(url, {
    headers: {
      Cookie: `espn_s2=${espnS2}; SWID=${swid}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://fantasy.espn.com/'
    }
  });
  if (!res.ok) {
    let msg = `ESPN returned an error (${res.status}).`;
    if (res.status === 401 || res.status === 403) {
      msg = 'ESPN rejected the stored cookies. Refresh the ESPN_S2 and ESPN_SWID secrets with fresh values from fantasy.espn.com.';
    } else if (res.status === 404) {
      msg = 'League not found on ESPN. Double-check the league ID and season year.';
    }
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function fetchLeague(season, leagueId, views) {
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=${views.join('&view=')}`;
  const data = await espnFetch(url);
  const league = (data.leagues && data.leagues[0]) || ((data.teams || data.settings || data.id) ? data : null);
  if (!league) throw new Error('ESPN responded, but no league data was returned.');
  return league;
}

// The league lives under the season ESPN currently serves it for — if the
// rollover hasn't happened yet, the previous season still holds the data.
export async function fetchLeagueCurrent(views) {
  const seasons = [defaultSeason(), defaultSeason() - 1];
  let lastError = null;
  for (const season of seasons) {
    try {
      const league = await fetchLeague(season, DEFAULT_LEAGUE_ID, views);
      return { league, season };
    } catch (e) {
      if (e && e.status === 404) { lastError = e; continue; }
      throw e;
    }
  }
  throw lastError || new Error('League not found on ESPN.');
}

export const SLOT_LABELS = { 0: 'QB', 2: 'RB', 3: 'RB/WR', 4: 'WR', 5: 'WR/TE', 6: 'TE', 7: 'OP', 16: 'DST', 17: 'K', 20: 'BE', 21: 'IR', 23: 'FLEX' };
export const BENCH_SLOTS = [20, 21];

export function round1(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

export function statValue(player, sourceId, periodId) {
  const stats = player && Array.isArray(player.stats) ? player.stats : [];
  const entry = stats.find(s => s.statSourceId === sourceId && s.scoringPeriodId === periodId);
  return entry ? (entry.appliedTotal ?? 0) : 0;
}

export function weeklyTrend(player, maxPeriod) {
  const actuals = (player && Array.isArray(player.stats) ? player.stats : [])
    .filter(s => s.statSourceId === 0 && s.scoringPeriodId > 0 && s.scoringPeriodId <= maxPeriod)
    .sort((a, b) => a.scoringPeriodId - b.scoringPeriodId)
    .map(s => ({ week: s.scoringPeriodId, points: round1(s.appliedTotal) }));
  return actuals;
}

export function parseTeamSummary(t) {
  const overall = (t.record && t.record.overall) || {};
  return {
    id: String(t.id),
    name: [t.location, t.nickname].filter(Boolean).join(' ') || t.name || `Team ${t.id}`,
    wins: overall.wins ?? 0,
    losses: overall.losses ?? 0,
    ties: overall.ties ?? 0,
    pointsFor: round1(overall.pointsFor),
    pointsAgainst: round1(overall.pointsAgainst)
  };
}

export function parseRosterPlayer(entry, currentPeriod) {
  const player = (entry.playerPoolEntry && entry.playerPoolEntry.player) || {};
  const slot = entry.lineupSlotId;
  const actuals = weeklyTrend(player, currentPeriod);
  const seasonActual = statValue(player, 0, 0);
  return {
    id: String(player.id ?? ''),
    name: player.fullName || 'Unknown player',
    position: SLOT_LABELS[slot] || player.defaultPosition || 'Player',
    slot,
    isStarter: !BENCH_SLOTS.includes(slot),
    injuryStatus: player.injuryStatus || 'ACTIVE',
    weeklyProj: round1(statValue(player, 1, currentPeriod)),
    seasonProj: round1(statValue(player, 1, 0) || seasonActual),
    seasonActual: round1(seasonActual),
    seasonAvg: actuals.length > 0 ? round1(seasonActual / actuals.length) : 0,
    trend: actuals.slice(-3)
  };
}

// Current matchup period + regular-season length, derived from the live league payload.
export function leaguePeriods(league) {
  return {
    currentPeriod: (league.status && (league.status.currentMatchupPeriod || league.status.latestScoringPeriod)) || 1,
    regSeasonPeriods: (league.settings && league.settings.scheduleSettings && league.settings.scheduleSettings.regSeasonMatchupPeriodCount) || 14
  };
}

// Full parsed roster (starters + bench) for one raw ESPN team.
export function parseTeamRoster(rawTeam, currentPeriod) {
  return ((rawTeam && rawTeam.roster && rawTeam.roster.entries) || []).map(e => parseRosterPlayer(e, currentPeriod));
}

export const PLAYBOOK_MODEL = 'Weighted decision model — apply to every call: Projections 30% + Matchup 25% + Injury risk 20% + Recent form (last 3 games) 15% + Schedule strength 10% = weighted edge in fantasy points. Confidence: HIGH if edge > 15 points, MEDIUM if edge > 5 points, LOW otherwise. Also weigh the player\'s QB situation and their history with their QB (target share, chemistry, recent game logs together).';