import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Link2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EspnLeagueLink() {
  const [linked, setLinked] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [leagueId, setLeagueId] = useState("");
  const [espnS2, setEspnS2] = useState("");
  const [swid, setSwid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.EspnLeague.list("-updated_date", 10)
      .then((records) => { if (active) setLinked(records); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await base44.functions.invoke("linkEspnLeague", {
        league_id: leagueId,
        espn_s2: espnS2,
        swid: swid,
      });
      const result = response.data;
      setSuccess(result);
      setShowForm(false);
      setLeagueId("");
      setEspnS2("");
      setSwid("");
      const refreshed = await base44.entities.EspnLeague.list("-updated_date", 10);
      setLinked(refreshed);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Could not link the league.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-900">ESPN League</span>
          {linked.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-3 w-3" /> {linked.length} linked
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm((v) => !v)}
          className="h-8 px-2 text-slate-600"
        >
          {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="text-xs">{showForm ? "Close" : "Link league"}</span>
        </Button>
      </div>

      {(success || linked.length > 0) && !showForm && (
        <div className="border-t border-slate-100 px-4 py-3">
          {success && (
            <p className="mb-2 text-sm font-medium text-emerald-700">
              Linked “{success.league.name}” ({success.teams.length} teams, {success.league.season} season).
            </p>
          )}
          {linked.length > 0 && (
            <ul className="space-y-1">
              {linked.map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{l.league_name}</span>
                  <span className="text-xs text-slate-400">
                    {l.league_id} · {l.season}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-100 px-4 py-4">
          <p className="text-xs text-slate-500">
            Log in to fantasy.espn.com, copy the <span className="font-mono">espn_s2</span> and{" "}
            <span className="font-mono">SWID</span> cookie values from your browser, and paste them below. They're
            stored securely and used only to read your league.
          </p>
          <div className="space-y-2">
            <Label htmlFor="leagueId">League ID</Label>
            <Input
              id="leagueId"
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              placeholder="e.g. 123456"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="espnS2">espn_s2 cookie</Label>
            <Input
              id="espnS2"
              value={espnS2}
              onChange={(e) => setEspnS2(e.target.value)}
              placeholder="Paste the espn_s2 value"
              className="font-mono text-xs"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="swid">SWID cookie</Label>
            <Input
              id="swid"
              value={swid}
              onChange={(e) => setSwid(e.target.value)}
              placeholder="Paste the SWID value"
              className="font-mono text-xs"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying with ESPN…
              </>
            ) : (
              "Link league"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}