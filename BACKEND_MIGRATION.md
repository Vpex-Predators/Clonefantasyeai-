# FantasyEAi isolated backend migration (staging only)

## Safety boundary
- Source of truth remains the live Base44 FantasyEAi app. This branch is NOT deployed and NOT merged into main.
- Do not change the live site's domain, DNS, environment variables, GitHub default branch, auth configuration or Base44 app.
- Existing Supabase projects "fantasy-command-center" and "fantasyeai-android-dev" are INACTIVE and may belong to other experiments. Do not restore, overwrite, or deploy to them without confirming ownership and contents.
- Do not auto-import secrets, cookies, DOBs, or account email from Base44.
- Never use existing Supabase "fantasy-data" Edge Function as a private data endpoint: its deployed configuration had verify_jwt=false and wildcard CORS.

## Migration inventory
Original Base44 server functions are already present under `base44/functions/*/entry.ts` (17 directories).
Shared deterministic modules synchronized from the latest original GitHub repository into `supabase/functions/_shared`:
- `espnLeague.js`: ESPN connector and 60s cache. Only `base44:runtime` secret access was replaced with `Deno.env.get`.
- `playoffOdds.js`: preserves the original scoring-profile assumptions and threat-board structure, but now uses 10,000 draws (previously 1,000), conditions in-progress outcomes on observed scores, preserves ESPN-confirmed final results, and matches random seeds across what-if scenarios. See `SIMULATION_VALIDATION.md`.
- `leaguePulse.js`: unchanged transaction/pattern aggregation.
- `simDay.js`: unchanged local-day logic.

First replacement endpoint: `supabase/functions/get-war-room-data/index.ts`
- Reuses the original GetWarRoomData analytics and response payload.
- Requires valid Supabase Auth user JWT. Sends no service-role key to browsers.
- Confirms the caller's own team lock via RLS before accessing private league/roster data.
- Strict preview-origin allowlist; no wildcard CORS; no-store responses; bounded request size.
- Not wired to frontend yet. Base44 still serves the app.
- Function refuses users who lack a migrated, verified team lock.

Staging database SQL: `supabase/staging_schema.sql`
- Four distinct tables with per-user SELECT RLS.
- All direct inserts, updates, and deletes by anon/authenticated are revoked pending backend write authorization.
- Separate non-exposed verified identity mapping between Base44 user IDs and Supabase Auth UUIDs.
- Intentionally excludes team-lock birthday and ESPN email. Refresh caches MUST be sanitized before import.

## Critical migration risks
1. The original `lockTeam` function checks only the *format* of user-supplied ESPN email and birthday, not proof the caller owns the selected ESPN team. Do NOT blindly port this authorization workflow. Replace it with verified ESPN authorization or an admin-reviewed one-time claim, never trusting user text fields.
2. The original `EspnLeague` entity policy has a full-name-based rule. Names are not authorization identities; replacement RLS uses `auth.uid()`.
3. Base44 login tokens are not interchangeable with Supabase Auth tokens. Users need a verified account migration or an explicit sign-in/recovery process.
4. The Base44 AI integration `Core.InvokeLLM` is vendor-specific. AI-dependent endpoints cannot be declared migrated until a server-side provider, output validation, usage limits, and parity tests exist.
5. ESPN_S2 and ESPN_SWID are secret cookies. Transfer them manually into the new staging environment secret store only, and rotate them if previously exposed.
6. Browser-facing `service_role` or `sb_secret_` keys are forbidden. Limit access to backend processes, use purpose-built access methods for writes, and never log Authorization or Cookie headers.

## Deployment gates (not yet performed)
1. Choose or create a dedicated isolated Supabase staging project; confirm cost, account ownership and region. Never target an existing production project.
2. On the isolated project, apply `staging_schema.sql`. Inspect security advisors and RLS policies before allowing any production-like data.
3. Configure Supabase Auth, validate ownership mapping to Base44 user IDs, then import a *sanitized* small test set before any larger export. Do not migrate passwords or raw verification PII.
4. Set staging-only secrets `ESPN_S2`, `ESPN_SWID` and `FANTASY_ALLOWED_ORIGINS` via dashboard/secret manager. Confirm provider terms and access permissions. Do not commit .env.
5. Generate a numbered Supabase CLI migration and deploy `get-war-room-data` to staging with `verify_jwt=true`.
6. Test no Authorization, invalid/expired JWT, wrong owner/league, valid team owner, unexpected input, source-provider failure, CORS rejection, provider request quotas, and no user records leaked in server logs.
7. Compare real outputs with the Base44 version for authorized test accounts. Preserve PPR calculations, weekly/seasonal values, injury statuses, projections and source provenance.
8. Port and validate remaining endpoints in dependency order: dashboard & scores; team lock & league link (authorization redesign); waivers, trades, AI analysis; account deletion; contact email. Use feature flags for canary cutover.
9. Update ONLY the separate development frontend's API client to use Supabase Auth and endpoints. Run regression tests across Compare, Team, War Room, Waivers, Analyst, mobile WebView.
10. Keep live production on Base44 until an explicit release approval and a tested rollback path. There is no automatic merge or DNS switch.

## Current state
- Source files inventoried from both original and clone; newer fixes from the original source preserved, including avoiding duplicate counting of current-week points in the playoff simulator.
- Algorithm-focused changes restricted to the isolated migration branch. All 9 GitHub Actions regressions passed (run 40093688310). Model predictive accuracy on actual historical NFL outcomes is NOT yet validated.
- One actual read-only function port staged.
- RLS DDL authored but NOT applied to any hosted database.
- No data records transferred; no secrets transferred; no users migrated.
- No Supabase or Vercel deployment created, and no live app routing changes.
