# Simulation validation: FantasyEAi staging backend

## Change scope
This applies ONLY to `supabase/functions/_shared/playoffOdds.js` in the isolated
`feature/secure-backend-migration-20261024` branch. The original Base44 backend,
the live FantasyEAi frontend, existing Supabase projects, and DNS are untouched.

## Improvements that have a mathematical correctness rationale

| Property | Before | Staging implementation |
|---|---|---|
| Monte Carlo sample count | 1,000 | 10,000 |
| Approx. maximum 95% sampling margin at 50% event probability | ±3.1 percentage points | ±0.98 percentage points |
| In-progress scores | Could sample final scores below points already scored | Samples from Gaussian conditional on final score >= observed |
| ESPN-confirmed final scores | Resimulated final matches still in current period | Preserves settled final home/away totals |
| Current-week win probability | Computed from unconditional past-team profiles | Estimated from simulated results conditioned on current live score |
| Multiple "force next N wins" scenarios | Unrelated draws add comparison noise | Common random-number seed across scenarios |

These are **numerical and consistency improvements**, not proof of higher predictive
accuracy. More Monte Carlo draws cannot fix systematically inaccurate team
means or variances. The remaining model assumptions require backtesting.

The model still derives team scoring distributions from completed ESPN matchups,
using independent Gaussian team scores per game. It does not yet directly
incorporate verified player snap counts, injury statuses, correlated lineups,
bye-week adjustments, game-progress percentages, or multi-provider
PPR projections into the probabilistic distribution.

### Validation performed
GitHub Actions, isolated branch run:
https://github.com/Vpex-Predators/Clonefantasyeai-/actions/runs/40093688310

Nine regression tests passed (0 failures), including:
- Only completed games contribute to scoring profiles.
- Head-to-head CDF symmetry.
- Simulated final scores never below already recorded points.
- Live points affect live-week win probability.
- Deterministic seeded outcomes, valid probabilities, 10,000 iterations.
- Balanced matches converge near a 50% win rate.
- Forced-win scenario progression is nondecreasing using paired seeds.
- Confirmed final scores remain final.
- A synthetic 12-team, 14-week War Room simulation finishes within 15 seconds.

On the GitHub Actions runner, the synthetic 12-team War Room CPU test
took about 1,009 ms. This is not a guarantee of Supabase Edge latency.

### Release gate for further accuracy claims
Collect historical ESPN league matchups across multiple seasons, reconstruct
each week's information **as it existed before that game**, and compare the
old and new models on the same out-of-sample fixtures. Measure:
- Brier score / log loss of win probabilities, along with calibration bins.
- Mean absolute error and RMSE of score projections.
- Coverage of probability and score intervals.
- Performance by position, injury category, season phase, and data source.
- End-to-end function latency and upstream request volume.

Only promote changes that improve held-out metrics without leaking future
information. No fabricated precision, no unvalidated new weighting, and
no silent override of model inputs.

## Deployment status
Code and tests committed to the isolated GitHub branch only.
No hosted database schema applied. No API secrets copied. No new endpoint
deployed, and no frontend switched. Production remains served by Base44.
