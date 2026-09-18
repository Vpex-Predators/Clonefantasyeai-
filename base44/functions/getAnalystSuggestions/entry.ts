import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import {
  DEFAULT_LEAGUE_ID, fetchLeagueCurrent, leaguePeriods, parseTeamRoster, parseTeamSummary
} from '../../shared/espnLeague.js';

const FALLBACK_QUESTIONS = [
  'Which of my starters should I shop for a trade right now?',
  'Who on the waiver wire best fixes my weakest position?',
  'Which bench player should I start over my lowest-projected starter?'
];

// Builds 3 personalized FAQ suggestions from the user's live roster weaknesses.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const locks = await base44.asServiceRole.entities.TeamLock.filter({ user_id: user.id, league_id: DEFAULT_LEAGUE_ID });
    const lock = locks[0];
    if (!lock) return Response.json({ questions: FALLBACK_QUESTIONS });

    const { league } = await fetchLeagueCurrent(['mTeam', 'mRoster']);
    const { currentPeriod } = leaguePeriods(league);
    const rawTeams = league.teams || [];
    const mySummary = rawTeams.map(parseTeamSummary).find(t => t.id === String(lock.team_id));
    const myRaw = rawTeams.find(t => String(t.id) === String(lock.team_id));
    if (!mySummary || !myRaw) return Response.json({ questions: FALLBACK_QUESTIONS });

    const roster = parseTeamRoster(myRaw, currentPeriod);
    const starters = roster.filter(p => p.isStarter);
    const bench = roster.filter(p => !p.isStarter).slice(0, 6);
    const rosterFacts = [
      ...starters.map(p => `${p.name} (${p.position}, proj ${p.weeklyProj}, season avg ${p.seasonAvg}, ${p.injuryStatus})`),
      ...bench.map(p => `[bench] ${p.name} (${p.position}, proj ${p.weeklyProj}, ${p.injuryStatus})`)
    ].join('; ');

    const analyses = await base44.asServiceRole.entities.PlayerAnalysis.filter({ user_id: user.id });
    const verdicts = analyses
      .slice(-10)
      .map(a => `${a.player_name}: ${a.verdict}${a.weighted_edge != null ? ` (edge ${a.weighted_edge})` : ''}`)
      .join('; ');

    const prompt = `You are preparing suggested questions for a fantasy football manager's AI trade analyst chat. Team: "${mySummary.name}" (${mySummary.wins}-${mySummary.losses}), week ${currentPeriod}. Roster: ${rosterFacts}.${verdicts ? ` Recent AI verdicts on this roster: ${verdicts}.` : ''} Identify the biggest weaknesses (injured starters, players projected below their season average, thin positions, risky bench pieces) and write exactly 3 personalized questions this manager should ask their analyst. Each question: one sentence, max 15 words, mention specific player names where relevant, answerable from roster and league data. Do not number them.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: { questions: { type: 'array', items: { type: 'string' } } },
        required: ['questions']
      }
    });
    const questions = Array.isArray(result.questions)
      ? result.questions.filter(q => typeof q === 'string' && q.trim()).slice(0, 3)
      : [];
    return Response.json({ questions: questions.length ? questions : FALLBACK_QUESTIONS });
  } catch (error) {
    return Response.json({ questions: FALLBACK_QUESTIONS });
  }
}