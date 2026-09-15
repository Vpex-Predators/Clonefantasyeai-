import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = body && body.file_url;
    if (typeof fileUrl !== 'string' || !/^https?:\/\//.test(fileUrl)) {
      return Response.json({ error: 'A valid file_url is required' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert NFL fantasy football analyst. The user uploaded a screenshot from their fantasy football app (e.g. ESPN Fantasy). First identify what kind of screen it shows (starting lineup, waiver wire, trade offer, matchup, standings, etc.). Read every player name, position, team, opponent, and any stats, injury notes, or trade details that are visible. Then give concise, actionable fantasy recommendations: who to start or sit, which waiver adds to prioritize (with priority order), whether to accept, decline, or counter a trade, etc. Base advice on visible matchups and fantasy best practices. Each recommendation's reasoning must be short (2-3 sentences), direct, and specific to the players actually visible. Only mention players you can actually see in the screenshot - never invent player names. If parts of the image are illegible, work with what is readable and note uncertainty in the summary.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          screen_type: { type: 'string', enum: ['lineup', 'waiver', 'trade', 'matchup', 'standings', 'other'] },
          summary: { type: 'string', description: 'One or two sentences describing what the screen shows and the overall takeaway' },
          players_identified: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                position: { type: 'string' },
                team: { type: 'string' }
              },
              required: ['name']
            }
          },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                player: { type: 'string' },
                action: { type: 'string', description: 'e.g. Start, Sit, Add, Drop, Accept trade, Decline trade, Monitor' },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
                reasoning: { type: 'string' }
              },
              required: ['player', 'action', 'confidence', 'reasoning']
            }
          }
        },
        required: ['screen_type', 'summary', 'players_identified', 'recommendations']
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}