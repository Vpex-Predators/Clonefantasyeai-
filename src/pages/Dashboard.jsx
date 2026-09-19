import React, { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, LogOut } from "lucide-react";
import AppNavBar from "@/components/AppNavBar";
import RefreshBar from "@/components/fantasy/dashboard/RefreshBar";
import TeamLockOverlay from "@/components/fantasy/dashboard/TeamLockOverlay";
import SeasonScoreChart from "@/components/fantasy/dashboard/SeasonScoreChart";
import MatchupEngine from "@/components/fantasy/dashboard/MatchupEngine";
import RosterCompare from "@/components/fantasy/dashboard/RosterCompare";
import PlayoffRunway from "@/components/fantasy/dashboard/PlayoffRunway";
import AdminPanel from "@/components/fantasy/dashboard/AdminPanel";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [matchup, setMatchup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("matchup");
  const hasTrackedView = useRef(false);
  const loadBoard = useCallback(async () => {
    const res = await base44.functions.invoke("getDashboardData", {});
    setData(res.data);
    if (res.data && !hasTrackedView.current) {
      hasTrackedView.current = true;
      base44.analytics.track({ eventName: "dashboard_viewed" });
    }
    return res.data;
  }, []);

  // Live data loads once per visit — all refreshing is manual (button taps).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadBoard();
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message || "Could not load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadBoard]);

  const analyzeOne = async player => {
    setAnalyzing(true);
    try {
      await base44.functions.invoke("analyzePlayers", {
        players: [{
          id: player.id,
          name: player.name,
          position: player.position,
          opponent: data?.opponent ? data.opponent.name : "TBD",
          weeklyProj: player.weeklyProj,
          seasonAvg: player.seasonAvg,
          injuryStatus: player.injuryStatus
        }],
        week: data?.league?.week
      });
      await loadBoard();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeMatchupNow = async () => {
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke("analyzeMatchup", {});
      setMatchup(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Manual refresh: cheap live-scores update only — no AI re-analysis.
  const lightRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await base44.functions.invoke("getLiveScores", {});
      const live = res.data;
      const mine = new Map((live.mine || []).map(p => [p.id, p]));
      const opp = new Map((live.opponent || []).map(p => [p.id, p]));
      const merge = (list, map) => (list || []).map(p => {
        const u = map.get(p.id);
        return u ? { ...p, livePoints: u.livePoints, weeklyProj: u.weeklyProj, injuryStatus: u.injuryStatus } : p;
      });
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          lastRefresh: live.refreshedAt || new Date().toISOString(),
          myTeam: prev.myTeam ? {
            ...prev.myTeam,
            starters: merge(prev.myTeam.starters, mine),
            bench: merge(prev.myTeam.bench, mine)
          } : prev.myTeam,
          opponentStarters: merge(prev.opponentStarters, opp),
          opponentBench: merge(prev.opponentBench, opp)
        };
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Highlights stay until the user actually opens that card.
  const markSeen = useCallback(keys => {
    if (!keys || !keys.length) return;
    setData(prev => (prev ? { ...prev, pending: (prev.pending || []).filter(k => !keys.includes(k)) } : prev));
    base44.functions.invoke("markUpdatesSeen", { keys }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center text-white">
        <p className="text-sm text-white/60">{error}</p>
        <button
          onClick={() => loadBoard().catch(err => setError(err.response?.data?.error || err.message))}
          className="rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          Try again
        </button>
        <AppNavBar />
      </div>
    );
  }

  if (!data.locked) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent" />
        <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400/80">
            {data.league.name} · Week {data.league.week}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold">Your live league HQ</h1>
          <p className="mt-2 max-w-xs text-sm text-white/50">
            Live scores, projections, matchup intel, waiver radar — all locked to your team.
          </p>
          {error && <p className="mt-4 max-w-xs text-xs text-rose-300">{error}</p>}
        </div>
        <TeamLockOverlay teams={data.teams} onLocked={() => loadBoard().catch(() => {})} />
        <AppNavBar />
      </div>
    );
  }

  // This week's headline score: actual points for games live/over, projections before kickoff.
  const eff = p => (p.livePoints != null ? p.livePoints : (p.weeklyProj || 0));
  const myScore = (data.myTeam.starters || []).reduce((s, p) => s + eff(p), 0);
  const oppScore = (data.opponentStarters || []).reduce((s, p) => s + eff(p), 0);
  const anyLive = [...(data.myTeam.starters || []), ...(data.opponentStarters || [])].some(p => p.livePoints != null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 pb-28 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent" />
      <div className="relative mx-auto max-w-2xl space-y-5 px-4 pt-8">
        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</div>
        )}

        <header>
          <div className="flex items-start justify-between gap-3">
            <p className="pt-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-400/80">
              {data.league.name} · Week {data.league.week}
            </p>
            <div className="flex flex-col items-end gap-1.5">
              <RefreshBar
                lastRefresh={data.lastRefresh}
                refreshing={refreshing}
                analyzing={analyzing}
                pendingCount={(data.pending || []).length}
                onRefresh={lightRefresh}
              />
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-rose-300"
              >
                <LogOut className="h-3 w-3" />
                Log out
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-end justify-center gap-4">
            <div className="min-w-0 flex-1 text-center">
              <p className="font-mono text-4xl font-bold leading-none text-emerald-300">{myScore.toFixed(1)}</p>
              <p className="mt-1 truncate text-xs font-semibold text-emerald-300/90">{data.myTeam.name}</p>
              <p className="text-[10px] text-white/40">{data.myTeam.wins}-{data.myTeam.losses} record</p>
            </div>
            <span className="shrink-0 bg-gradient-to-r from-emerald-400 to-rose-400 bg-clip-text pb-1 font-heading text-xl font-bold italic tracking-widest text-transparent">
              VS
            </span>
            <div className="min-w-0 flex-1 text-center">
              <p className="font-mono text-4xl font-bold leading-none text-rose-300">
                {data.opponent ? oppScore.toFixed(1) : "—"}
              </p>
              <p className="mt-1 truncate text-xs font-semibold text-rose-300/90">
                {data.opponent ? data.opponent.name : "Bye week"}
              </p>
              {data.opponent && (
                <p className="text-[10px] text-white/40">{data.opponent.wins}-{data.opponent.losses} record</p>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-white/40">
            {anyLive ? "live — actual points lock in as games finish" : "projected totals"}
          </p>
        </header>

        <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setTab("matchup")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
              tab === "matchup" ? "bg-emerald-400 text-slate-950" : "text-white/60"
            }`}
          >
            This week
          </button>
          <button
            onClick={() => setTab("season")}
            className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
              tab === "season" ? "bg-emerald-400 text-slate-950" : "text-white/60"
            }`}
          >
            Season
          </button>
        </div>

        {tab === "season" ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">
                Season totals: <span className="font-semibold text-white">{data.myTeam.pointsFor} pts for</span> ·{" "}
                <span className="font-semibold text-white">{data.myTeam.pointsAgainst} against</span>
              </p>
              <p className="mt-0.5 text-[10px] text-white/40">Starters-only scoring across completed weeks.</p>
            </div>
            <SeasonScoreChart
              myTeam={data.myTeam}
              teams={data.teams}
              headToHead={data.headToHead}
              weeklyScores={data.weeklyScores}
            />
          </>
        ) : (
          <>
            <MatchupEngine
              myTeam={data.myTeam}
              opponent={data.opponent}
              opponentStarters={data.opponentStarters}
              opponentBench={data.opponentBench}
              matchup={matchup}
              week={data.league.week}
              analyzing={analyzing}
              onAnalyze={analyzeMatchupNow}
              pending={data.pending}
              onSeen={markSeen}
            />

            <RosterCompare
              starters={data.myTeam.starters}
              bench={data.myTeam.bench}
              pending={data.pending}
              onSeen={markSeen}
              onAnalyze={analyzeOne}
              analyzing={analyzing}
            />

            <PlayoffRunway playoffOdds={data.playoffOdds} />

            <AdminPanel isAdmin={user?.role === "admin"} teams={data.teams} />
          </>
        )}
      </div>
      <AppNavBar />
    </div>
  );
}