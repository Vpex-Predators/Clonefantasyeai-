// Request-scoped authentication and RLS-constrained data access.
// No service-role credential is required or accepted by this module.
const config = () => {
  const url = Deno.env.get("SUPABASE_URL")?.replace(/\/$/, "");
  const key = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key || !/^https:\/\//.test(url)) throw new Error("Backend configuration unavailable");
  return { url, key };
};
const bearer = (req) => {
  const h = req.headers.get("authorization") || "";
  const m = /^Bearer\s+([^\s]{20,8192})$/i.exec(h);
  return m?.[1] || null;
};
const headersFor = (req) => {
  const { key } = config();
  const token = bearer(req);
  if (!token) return null;
  return { apikey: key, authorization: "Bearer " + token, accept: "application/json" };
};
export const corsHeadersFor = (req) => {
  const origin = req.headers.get("origin");
  if (!origin) return {};
  const allowed = (Deno.env.get("FANTASY_ALLOWED_ORIGINS") || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "300",
    "Vary": "Origin"
  };
};
export async function getAuthenticatedUser(req) {
  const h = headersFor(req);
  if (!h) return null;
  const { url } = config();
  const res = await fetch(url + "/auth/v1/user", { headers: h, signal: AbortSignal.timeout(9000), cache: "no-store" });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("Authentication provider unavailable");
  const user = await res.json();
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(user?.id || ""))) return null;
  return { id: user.id };
}
export async function getTeamLocksForUser(req, userId, leagueId) {
  const h = headersFor(req);
  if (!h || !/^[0-9a-f-]{36}$/i.test(userId) || !/^\d{1,15}$/.test(leagueId)) return [];
  const { url } = config();
  const endpoint = new URL(url + "/rest/v1/fantasy_team_locks");
  endpoint.searchParams.set("select", "id,league_id,team_id,team_name");
  endpoint.searchParams.set("user_id", "eq." + userId);
  endpoint.searchParams.set("league_id", "eq." + leagueId);
  endpoint.searchParams.set("limit", "1");
  const res = await fetch(endpoint, { headers: h, signal: AbortSignal.timeout(9000), cache: "no-store" });
  if (!res.ok) throw new Error("Team access lookup failed");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
