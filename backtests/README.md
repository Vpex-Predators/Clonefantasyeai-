# Calibrated probability challenger — offline validation only

**This is not wired to the live FantasyEAi backend.** It is deliberately
disabled until sufficient chronological league outcomes are available.

Run locally with a **private** historical JSON array:
```sh
node backtests/runCalibration.mjs /secure/local/path/forecasts.json
```

One row per **independent fantasy head-to-head matchup**. Use the original
forecast captured before the relevant outcome; don't rescore after knowing
the result. Remove duplicate mirrored and repeated snapshots first.

Example schema (fictional):
```json
[
  {
    "season": 2025,
    "week": 1,
    "leagueId": "private-league",
    "matchupId": "canonical-team-pair-id",
    "scoring": "PPR",
    "phase": "pregame",
    "predictedAt": "2025-09-07T15:00:00Z",
    "kickoffAt": "2025-09-07T17:00:00Z",
    "resolvedAt": "2025-09-09T05:00:00Z",
    "probability": 0.72,
    "outcome": 1
  }
]
```
`phase=live` requires `kickoffAt <= predictedAt < resolvedAt`.
`phase=pregame` requires `predictedAt < kickoffAt < resolvedAt`.
The archive is scoped to **one PPR league and one phase** at a time.

The validator refuses calibration unless it sees at least **100 training**
games across 8 prior weeks and **60 later held-out** games across 5 weeks.
It picks one conservative logistic-temperature shrinkage level using only
past weeks, then compares it against the original and a 50% baseline on
untouched later weeks. Candidate promotion requires:
- Held-out Brier score improvement >= 0.005.
- Held-out log loss improvement.
- Beating the 50% baseline in held-out Brier.
- Positive lower bound of a weekly block-bootstrap gain interval.
- Independent review and another-season replication before any deployment.

It does **not** claim that scaling probabilities is inherently superior;
calibration is rejected if the held-out evidence is weak or negative.
It cannot create history that was not archived. Saved Base44 forecast snapshots
currently have too few distinct completed matchups to support fitting a
statistically defensible calibration.

This testing layer does not touch production DNS, Vercel settings, Base44
entities, Supabase databases, or accounts. Keep real record files private;
never commit them to this public repository.
