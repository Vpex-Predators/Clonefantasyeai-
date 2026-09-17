// Shared playoff-odds engine: a per-matchup win-probability model plus a
// 1,000-run Monte Carlo simulation of the remaining regular-season schedule.
// Used by getDashboardData and analyzeBriefing.

function normalCdf(x) {
  // Abramowitz & Stegun 7.1.26 error-function approximation.
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x >= 0 ? 1 - p : p;
}

function gauss(mean, std) {
  const u = Math.max(Math.random(), 1e-12);
  const v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function playOne(a, b, profiles) {
  return gauss(profiles[a].mean, profiles[a].std) >= gauss(profiles[b].mean, profiles[b].std) ? a : b;
}

function playBracket(field, profiles) {
  let round = field.slice();
  if (field.length === 6) {
    // Standard 6-team bracket: top two seeds bye, 3v6 and 4v5 in round one.
    const w45 = playOne(field[3], field[4], profiles);
    const w36 = playOne(field[2], field[5], profiles);
    round = [field[0], field[1], w45, w36];
  }
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < Math.floor(round.length / 2); i++) {
      next.push(playOne(round[i], round[round.length - 1 - i], profiles));
    }
    if (round.length % 2 === 1) next.push(round[Math.floor(round.length / 2)]);
    round = next;
  }
  return round[0];
}

export function computePlayoffOdds({ teams, schedule, currentPeriod, regSeasonPeriods, playoffTeamCount = 6, myTeamId, gamesPlayed }) {
  if (!teams || !teams.length) return null;

  const teamById = {};
  for (const t of teams) teamById[t.id] = { ...t, games: [] };

  // Completed-week scores feed each team's scoring profile.
  const allScores = [];
  for (const m of schedule || []) {
    if (m.matchupPeriodId >= currentPeriod) continue;
    for (const side of [m.home || {}, m.away || {}]) {
      if (side.teamId == null) continue;
      const id = String(side.teamId);
      if (!(id in teamById)) continue;
      const pts = Number(side.totalPoints) || 0;
      teamById[id].games.push(pts);
      allScores.push(pts);
    }
  }

  const leagueMean = allScores.length ? allScores.reduce((s, p) => s + p, 0) / allScores.length : 90;
  const leagueStd = allScores.length > 1
    ? Math.max(6, Math.sqrt(allScores.reduce((s, p) => s + (p - leagueMean) ** 2, 0) / allScores.length))
    : 20;

  const profiles = {};
  for (const t of teams) {
    const pts = teamById[t.id].games;
    const mean = pts.length ? pts.reduce((s, p) => s + p, 0) / pts.length : (gamesPlayed ? t.pointsFor / gamesPlayed : leagueMean);
    const std = pts.length >= 3 ? Math.max(5, Math.sqrt(pts.reduce((s, p) => s + (p - mean) ** 2, 0) / pts.length)) : leagueStd;
    profiles[t.id] = { mean, std };
  }

  const wp = (a, b) => normalCdf((profiles[a].mean - profiles[b].mean) / Math.sqrt(profiles[a].std ** 2 + profiles[b].std ** 2));

  const remaining = (schedule || []).filter(m => m.matchupPeriodId >= currentPeriod && m.matchupPeriodId <= regSeasonPeriods);

  // Win-probability model view of my remaining schedule.
  const mineRemaining = [];
  if (myTeamId && teamById[String(myTeamId)]) {
    const my = String(myTeamId);
    for (const m of remaining) {
      const home = String((m.home || {}).teamId ?? '');
      const away = String((m.away || {}).teamId ?? '');
      const oppId = home === my ? away : (away === my ? home : null);
      if (!oppId || !(oppId in teamById)) continue;
      const opp = teamById[oppId];
      const p = wp(my, oppId);
      mineRemaining.push({
        week: m.matchupPeriodId,
        opponent: { id: oppId, name: opp.name, wins: opp.wins, losses: opp.losses, avgPoints: Math.round(profiles[oppId].mean * 10) / 10 },
        winProb: Math.round(p * 100),
        grade: p >= 0.6 ? 'Favorable' : p <= 0.4 ? 'Tough' : 'Even'
      });
    }
    mineRemaining.sort((a, b) => a.week - b.week);
  }

  // --- 1,000-run Monte Carlo over the remaining schedule ---
  const sims = 1000;
  const count = Math.min(playoffTeamCount, teams.length);
  const baseWins = {}, basePts = {};
  const playoffCount = {}, titleCount = {}, winsSum = {}, rankCount = {};
  for (const t of teams) {
    baseWins[t.id] = t.wins + 0.5 * (t.ties || 0);
    basePts[t.id] = t.pointsFor;
    playoffCount[t.id] = 0; titleCount[t.id] = 0; winsSum[t.id] = 0; rankCount[t.id] = {};
  }

  for (let s = 0; s < sims; s++) {
    const wins = { ...baseWins };
    const pts = { ...basePts };
    for (const m of remaining) {
      const a = String((m.home || {}).teamId ?? '');
      const b = String((m.away || {}).teamId ?? '');
      if (!(a in teamById) || !(b in teamById)) continue;
      const sa = gauss(profiles[a].mean, profiles[a].std);
      const sb = gauss(profiles[b].mean, profiles[b].std);
      pts[a] += sa; pts[b] += sb;
      if (sa > sb) wins[a] += 1; else if (sb > sa) wins[b] += 1;
    }
    const order = teams.map(t => t.id).sort((x, y) => (wins[y] - wins[x]) || (pts[y] - pts[x]));
    order.forEach((id, i) => {
      rankCount[id][i + 1] = (rankCount[id][i + 1] || 0) + 1;
      winsSum[id] += wins[id];
    });
    const field = order.slice(0, count);
    for (const id of field) playoffCount[id] += 1;
    titleCount[playBracket(field, profiles)] += 1;
  }

  let mine = null;
  if (myTeamId && teamById[String(myTeamId)]) {
    const myId = String(myTeamId);
    const seedDist = rankCount[myId] || {};
    let likelySeed = 1, best = 0;
    for (const key of Object.keys(seedDist)) {
      if (seedDist[key] > best) { best = seedDist[key]; likelySeed = Number(key); }
    }
    const currentWeek = mineRemaining.find(r => r.week === currentPeriod);
    mine = {
      id: myId,
      playoffPct: Math.round((playoffCount[myId] / sims) * 100),
      titlePct: Math.round((titleCount[myId] / sims) * 1000) / 10,
      likelySeed,
      currentWeekWinProb: currentWeek ? currentWeek.winProb : null,
      remaining: mineRemaining
    };
  }

  const race = teams.map(t => ({
    id: t.id, name: t.name, wins: t.wins, losses: t.losses, ties: t.ties || 0, pointsFor: t.pointsFor,
    avgPoints: Math.round(profiles[t.id].mean * 10) / 10,
    playoffPct: Math.round((playoffCount[t.id] / sims) * 100),
    titlePct: Math.round((titleCount[t.id] / sims) * 1000) / 10,
    avgWins: Math.round((winsSum[t.id] / sims) * 10) / 10
  })).sort((a, b) => (b.wins + b.ties * 0.5) - (a.wins + a.ties * 0.5) || b.playoffPct - a.playoffPct);

  return { sims, playoffTeamCount: count, race, mine };
}