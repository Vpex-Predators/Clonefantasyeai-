import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Lock, Radar, Swords, LayoutDashboard, Calculator } from "lucide-react";
import AppNavBar from "@/components/AppNavBar";
import GlassBackdrop from "@/components/hud/GlassBackdrop";
import HudStatusBar from "@/components/hud/HudStatusBar";
import FloatingAuthCard from "@/components/fantasy/home/FloatingAuthCard";
import MissionStats from "@/components/fantasy/home/MissionStats";
import LeaguePulse from "@/components/fantasy/home/LeaguePulse";
import AiAnalystPanel from "@/components/fantasy/home/AiAnalystPanel";

function LockedSkeleton() {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-white/10 bg-white/[0.03] p-4 opacity-40 blur-[3px]">
          <div className="mb-2 h-2 w-28 bg-white/25" />
          <div className="space-y-1.5">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-5 bg-white/15" />
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
  const d = data && data.locked ? data : null;

  return (
    <div className="min-h-screen bg-slate-950 pb-28 text-white">
      <GlassBackdrop />
      <HudStatusBar
        title="Mission briefing"
        sub={d ? `${d.league.name.trim()} · WK ${d.league.week} · ${d.myTeam.wins}-${d.myTeam.losses}` : "FANTASYEDGE TACTICAL BRIEFING SYSTEM"}
        tag={d ? "LIVE" : "STANDBY"}
      />

      <div className="relative z-10 mx-auto max-w-2xl space-y-3 px-3 pt-3">
        <FloatingAuthCard />

        {loadingBriefing ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
          </div>
        ) : !isAuthenticated ? (
          <>
            <p className="flex items-center justify-center gap-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
              <Radar className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              Live playoff odds, matchup edge & league pulse load here
            </p>
            <LockedSkeleton />
          </>
        ) : error ? (
          <div className="border border-rose-400/30 bg-rose-400/10 p-3 font-mono text-xs text-rose-300">{error}</div>
        ) : data && !data.locked ? (
          <div className="border border-emerald-400/25 bg-emerald-400/10 p-5 text-center">
            <Lock className="mx-auto h-6 w-6 text-emerald-300" />
            <p className="mt-2 font-heading text-sm font-bold uppercase tracking-widest text-white">
              Lock in your team to activate the briefing
            </p>
            <p className="mt-1 text-xs text-white/50">One-time verification anchors your account to your roster.</p>
            <Link
              to="/dashboard"
              className="mt-3 inline-block bg-emerald-400 px-5 py-2 text-xs font-bold uppercase tracking-widest text-slate-950 hover:bg-emerald-300"
            >
              Go to dashboard
            </Link>
          </div>
        ) : d ? (
          <>
            <MissionStats data={d} />
            <LeaguePulse data={d} />

            <Link
              to="/warroom"
              className="relative block rounded-2xl border border-rose-400/40 bg-rose-400/[0.07] p-4 backdrop-blur-xl transition-colors hover:border-rose-400/70 hover:bg-rose-400/10"
            >
              <div className="flex items-center gap-2 text-rose-300">
                <Swords className="h-4 w-4" />
                <p className="font-heading text-sm font-bold uppercase tracking-[0.18em]">War room</p>
              </div>
              <p className="mt-1.5 text-[11px] text-white/55">
                Threat board · AI power rankings · trade impact simulator
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-rose-300/70">Enter war room →</p>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/dashboard"
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40"
              >
                <LayoutDashboard className="h-4 w-4 text-emerald-300" />
                <p className="mt-1.5 text-xs font-bold text-white">Command deck</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Full live dashboard</p>
              </Link>
              <Link
                to="/analyst"
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40"
              >
                <Calculator className="h-4 w-4 text-emerald-300" />
                <p className="mt-1.5 text-xs font-bold text-white">Trade analyst</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Trade & waiver chat</p>
              </Link>
            </div>

            <AiAnalystPanel data={d} />
          </>
        ) : null}
      </div>
      <AppNavBar />
    </div>
  );
}