import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { PLAYBOOK_MODEL } from '../../shared/espnLeague.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const players = Array.isArray(body.players) ? body.players.slice(0, 15) : [];
    if (players.length === 0) return Response.json({ error: 'No players provided.' }, { status: 400 });
    const week = Number(body.week) || null;

    // Skip players whose inputs (week, projection, injury, opponent) haven't
    // changed and whose analysis is under a day old — repeated refreshes stay cheap.
    const existingAnalyses = await base44.asServiceRole.entities.PlayerAnalysis.filter({ user_id: user.id });
    const byPlayer = {};
    for (const a of existingAnalyses) byPlayer[String(a.player_id)] = a;
    const inputSignature = p => [week, p.weeklyProj ?? 0, p.injuryStatus || 'ACTIVE', p.opponent || 'TBD'].join('|');
    const freshCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const toAnalyze = players.filter(p => {
      const a = byPlayer[String(p.id)];
      if (!a) return true;
      if (a.input_signature !== inputSignature(p)) return true;
      return !a.analyzed_at || new Date(a.analyzed_at).getTime() < freshCutoff;
    });
    if (toAnalyze.length === 0) return Response.json({ players: [], skipped: players.length });

    const lines = toAnalyze.map(p =>
      `${p.name} (${p.position}) — this week vs ${p.opponent || 'TBD'}; projected ${p.weeklyProj ?? 0} pts; season avg ${p.seasonAvg ?? 0}; injury status ${p.injuryStatus || 'ACTIVE'}`
    ).join('\n');

    const prompt = `You are an elite NFL fantasy football analyst. Analyze these fantasy players for week ${week ?? 'this week'} of the NFL season.\n\n${PLAYBOOK_MODEL}\n\nPlayers:\n${lines}\n\nFor each player: use your web search for the LATEST news, injuries, projections, and matchup data, and factor in the player's QB situation and their history with their QB (target share, chemistry, recent games together). Decide the verdict: "Start" (start them in a standard lineup), "Sit" (bench them), "Trade" (shop them while their value is high), or "Hold" (keep, situation unclear). Compute the weighted edge in fantasy points for the recommendation, give the single latest news headline, a 2-3 sentence analysis citing numbers, and 3-4 short factor bullets citing stats.\n\nReturn exactly one entry per input player, matching the input name exactly.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          players: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                verdict: { type: 'string', enum: ['Start', 'Sit', 'Trade', 'Hold'] },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                weighted_edge: { type: 'number' },
                news_headline: { type: 'string' },
                analysis: { type: 'string' },
                factors: { type: 'array', items: { type: 'string' } }
              },
              required: ['name', 'verdict', 'confidence', 'news_headline', 'analysis']
            }
          }
        },
        required: ['players']
      }
    });

    const returned = result && Array.isArray(result.players) ? result.players : [];
    const now = new Date().toISOString();
    const saved = [];
    for (const r of returned) {
      const match = toAnalyze.find(p => (p.name || '').toLowerCase().trim() === (r.name || '').toLowerCase().trim());
      if (!match || !match.id) continue;
      const record = {
        user_id: user.id,
        player_id: String(match.id),
        player_name: match.name,
        verdict: r.verdict || 'Hold',
        confidence: r.confidence || 'low',
        weighted_edge: typeof r.weighted_edge === 'number' ? r.weighted_edge : 0,
        news_headline: r.news_headline || '',
        analysis: r.analysis || '',
        factors: Array.isArray(r.factors) ? r.factors.slice(0, 5) : [],
        analyzed_at: now,
        input_signature: inputSignature(match)
      };
      const existing = byPlayer[record.player_id];
      if (existing) await base44.asServiceRole.entities.PlayerAnalysis.update(existing.id, record);
      else await base44.asServiceRole.entities.PlayerAnalysis.create(record);
      saved.push(record);
    }

    return Response.json({ players: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}