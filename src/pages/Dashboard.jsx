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
import WaiverRadar from "@/components/fantasy/dashboard/WaiverRadar";
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
  const lastLoadRef = useRef(0);

  const loadBoard = useCallback(async () => {
    const res = await base44.functions.invoke("getDashboardData", {});
    setData(res.data);
    lastLoadRef.current = Date.now();
    return res.data;
  }, []);

  // Live data auto-refreshes whenever the user comes back to the app.
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
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastLoadRef.current < 120000) return;
      loadBoard().catch(() => {});
    };
    window.addEventListener("focus", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onVisible);
    };
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

  // Manual refresh: fresh live data + deep AI analysis (players + matchup).
  const refreshAll = async () => {
    setRefreshing(true);
    try {
      const board = await loadBoard();
      setMatchup(null);
      if (!board.locked || !board.myTeam) return;
      setAnalyzing(true);
      const players = [...board.myTeam.starters, ...board.myTeam.bench]
        .slice(0, 15)
        .map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          opponent: board.opponent ? board.opponent.name : "TBD",
          weeklyProj: p.weeklyProj,
          seasonAvg: p.seasonAvg,
          injuryStatus: p.injuryStatus
        }));
      const calls = [base44.functions.invoke("analyzePlayers", { players, week: board.league.week })];
      if (board.opponent) calls.push(base44.functions.invoke("analyzeMatchup", {}));
      const results = await Promise.all(calls);
      if (results[1]) setMatchup(results[1].data);
      await loadBoard();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setAnalyzing(false);
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 pb-28 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent" />
      <div className="relative mx-auto max-w-2xl space-y-5 px-4 pt-8">
        {error && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</div>
        )}

        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400/80">
              {data.league.name} · Week {data.league.week}
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight">{data.myTeam.name}</h1>
            <p className="mt-1 text-sm text-white/60">
              {data.myTeam.wins}-{data.myTeam.losses} record · {data.myTeam.pointsFor} pts for · {data.myTeam.pointsAgainst} against
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RefreshBar
              lastRefresh={data.lastRefresh}
              refreshing={refreshing}
              analyzing={analyzing}
              pendingCount={(data.pending || []).length}
              onRefresh={refreshAll}
            />
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 transition-colors hover:text-rose-300"
            >
              <LogOut className="h-3 w-3" />
              Log out
            </button>
          </div>
        </header>

        <SeasonScoreChart
          myTeam={data.myTeam}
          teams={data.teams}
          headToHead={data.headToHead}
          weeklyScores={data.weeklyScores}
        />

        <MatchupEngine
          myTeam={data.myTeam}
          opponent={data.opponent}
          opponentStarters={data.opponentStarters}
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

        <WaiverRadar freeAgents={data.freeAgents} bench={data.myTeam.bench} />

        <PlayoffRunway playoffOdds={data.playoffOdds} />

        <AdminPanel isAdmin={user?.role === "admin"} teams={data.teams} />
      </div>
      <AppNavBar />
    </div>
  );
}