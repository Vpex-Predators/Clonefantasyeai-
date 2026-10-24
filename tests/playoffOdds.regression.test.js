import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfiles, pairwiseWinProb, computePlayoffOdds } from '../supabase/functions/_shared/playoffOdds.js';

// Seeded randomness is confined to the tests; the production algorithm remains unchanged.
function withSeed(seed, fn) {
  const old = Math.random;
  let state = seed >>> 0;
  Math.random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  try { return fn(); } finally { Math.random = old; }
}

function fixture(currentA = 20) {
  const ids = ['A', 'B', 'C', 'D'];
  const teams = ids.map(id => ({
    id, name: id, wins: 0, losses: 1, ties: 0,
    pointsFor: 100 + (id === 'A' ? currentA : 0)
  }));
  const schedule = [
    { matchupPeriodId: 1, home: { teamId: 'A', totalPoints: 100 }, away: { teamId: 'C', totalPoints: 100 } },
    { matchupPeriodId: 1, home: { teamId: 'B', totalPoints: 100 }, away: { teamId: 'D', totalPoints: 100 } },
    { matchupPeriodId: 2, home: { teamId: 'A', totalPoints: currentA }, away: { teamId: 'C', totalPoints: 0 } },
    { matchupPeriodId: 2, home: { teamId: 'B', totalPoints: 0 }, away: { teamId: 'D', totalPoints: 0 } },
  ];
  return { teams, schedule, currentPeriod: 2, regSeasonPeriods: 2, playoffTeamCount: 1, myTeamId: 'A', gamesPlayed: 1 };
}

test('exclude in-progress current-week totals from completed-week team scoring profiles', () => {
  const a = buildProfiles(fixture(20));
  const b = buildProfiles(fixture(120));
  assert.deepEqual(a, b);
  assert.equal(a.profiles.A.mean, 100);
});

test('normalized head-to-head odds are symmetric and reward higher mean at equal variance', () => {
  const profiles = { A: { mean: 110, std: 17 }, B: { mean: 100, std: 17 } };
  const p = pairwiseWinProb(profiles, 'A', 'B');
  assert.ok(p > 0.5 && p < 1);
  assert.ok(Math.abs(p + pairwiseWinProb(profiles, 'B', 'A') - 1) < 1e-9);
});

test('current-week partial-score bookkeeping does not double-count tiebreak points', () => {
  // Increasing ONLY the observed partial score and pointsFor by the same amount
  // must not change the projected full-week tiebreak distribution.
  // Previous versions added the partial score twice and failed this test.
  const early = withSeed(20261024, () => computePlayoffOdds(fixture(20)));
  const later = withSeed(20261024, () => computePlayoffOdds(fixture(120)));
  assert.deepEqual(early.race, later.race);
  assert.deepEqual(early.mine, later.mine);
});

test('playoff odds remain bounded and results repeat under identical scenario and seed', () => {
  const a = withSeed(42, () => computePlayoffOdds(fixture(20)));
  const b = withSeed(42, () => computePlayoffOdds(fixture(20)));
  assert.deepEqual(a, b);
  assert.equal(a.sims, 1000);
  for (const team of a.race) {
    assert.ok(team.playoffPct >= 0 && team.playoffPct <= 100);
    assert.ok(team.titlePct >= 0 && team.titlePct <= 100);
    assert.ok(Number.isFinite(team.avgWins));
  }
});
