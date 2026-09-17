import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, LayoutDashboard, Calculator, Lock, Radar } from "lucide-react";
import AppNavBar from "@/components/AppNavBar";
import FloatingAuthCard from "@/components/fantasy/home/FloatingAuthCard";
import MissionStats from "@/components/fantasy/home/MissionStats";
import LeaguePulse from "@/components/fantasy/home/LeaguePulse";
import AiAnalystPanel from "@/components/fantasy/home/AiAnalystPanel";

function LockedSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 opacity-40 blur-[3px]">
          <div className="mb-2 h-2.5 w-32 rounded bg-white/25" />
          <div className="space-y-1.5">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-6 rounded-lg bg-white/15" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getDashboardData", {});
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message || "Could not load your briefing.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadingBriefing = isLoadingAuth || (isAuthenticated && loading && !data);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 pb-28 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent" />
      <div className="relative mx-auto max-w-2xl space-y-5 px-4 pt-6">
        <FloatingAuthCard />

        {loadingBriefing ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
          </div>
        ) : !isAuthenticated ? (
          <>
            <p className="flex items-center justify-center gap-2 text-center text-xs text-white/45">
              <Radar className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              Live playoff odds, matchup edge, and league pulse load here the moment you sign in.
            </p>
            <LockedSkeleton />
          </>
        ) : error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-300">{error}</div>
        ) : data && !data.locked ? (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
            <Lock className="mx-auto h-6 w-6 text-emerald-300" />
            <p className="mt-2 text-sm font-semibold text-white">Lock in your team to activate the briefing</p>
            <p className="mt-1 text-xs text-white/50">One-time verification anchors your account to your roster.</p>
            <Link
              to="/dashboard"
              className="mt-3 inline-block rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
            >
              Go to dashboard
            </Link>
          </div>
        ) : data && data.locked ? (
          <>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400/80">
                {data.league.name} · Week {data.league.week}
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight">Mission briefing</h2>
            </div>

            <MissionStats data={data} />
            <LeaguePulse data={data} />

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:border-emerald-400/40"
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-300" />
                <p className="mt-1.5 text-xs font-bold text-white">Command deck</p>
                <p className="text-[10px] text-white/45">Full live dashboard</p>
              </Link>
              <Link
                to="/analyst"
                className="rounded-2xl border border-white/10 bg-white/5 p-3.5 hover:border-emerald-400/40"
              >
                <Calculator className="h-4 w-4 text-emerald-300" />
                <p className="mt-1.5 text-xs font-bold text-white">Trade analyst</p>
                <p className="text-[10px] text-white/45">Trade & waiver chat</p>
              </Link>
            </div>

            <AiAnalystPanel data={data} />
          </>
        ) : null}
      </div>
      <AppNavBar />
    </div>
  );
}