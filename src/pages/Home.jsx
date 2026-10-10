import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowRight, GitCompareArrows, Loader2, Lock, Radar } from "lucide-react";
import AppNavBar from "@/components/AppNavBar";
import OpenButton from "@/components/hud/OpenButton";
import GlassBackdrop from "@/components/hud/GlassBackdrop";
import HudStatusBar from "@/components/hud/HudStatusBar";
import FloatingAuthCard from "@/components/fantasy/home/FloatingAuthCard";
import MatchupHero from "@/components/fantasy/home/MatchupHero";
import WaiverLineupCard from "@/components/fantasy/home/WaiverLineupCard";
import WarRoomCard from "@/components/fantasy/home/WarRoomCard";
import TeamStatusCard from "@/components/fantasy/home/TeamStatusCard";
import LeagueRivalsCard from "@/components/fantasy/home/LeagueRivalsCard";
import LeaguePulseCard from "@/components/fantasy/home/LeaguePulseCard";
import AnalystDoorwayCard from "@/components/fantasy/home/AnalystDoorwayCard";
import AiAnalystPanel from "@/components/fantasy/home/AiAnalystPanel";
import { PlayerNameProvider } from "@/components/PlayerNameProvider";

function LockedSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2" aria-hidden="true">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="app-card min-h-32 animate-pulse rounded-[1.35rem] p-4 opacity-60">
          <div className="mb-3 h-4 w-32 rounded bg-white/10" />
          <div className="space-y-2">
            <div className="h-6 rounded bg-white/[0.07]" />
            <div className="h-6 w-4/5 rounded bg-white/[0.07]" />
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
    <div className="min-h-screen bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] text-white">
      <GlassBackdrop />
      <HudStatusBar
        title="FantasyEAi"
        sub={d ? d.league.name.trim() + " · Week " + d.league.week + " · " + d.myTeam.wins + "-" + d.myTeam.losses : "Your fantasy decision engine"}
        tag={d ? "LIVE" : "READY"}
      />

      <main className="relative z-10 mx-auto max-w-5xl space-y-4 px-4 pt-4 sm:px-6">
        <FloatingAuthCard />

        {loadingBriefing ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
          </div>
        ) : !isAuthenticated ? (
          <>
            <section className="app-card rounded-[1.6rem] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Radar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">One place for every weekly decision</h2>
                  <p className="mt-1 max-w-xl text-sm leading-6 text-white/55">
                    Compare players, check your matchup, scan waivers and review league threats without digging through separate screens.
                  </p>
                </div>
              </div>
            </section>
            <LockedSkeleton />
          </>
        ) : error ? (
          <div className="app-card rounded-[1.35rem] border-rose-400/25 p-4 text-sm text-rose-300">{error}</div>
        ) : data && !data.locked ? (
          <section className="app-card rounded-[1.6rem] p-6 text-center">
            <Lock className="mx-auto h-7 w-7 text-emerald-300" />
            <h2 className="mt-3 font-heading text-xl font-bold">Connect your team</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-white/55">
              Lock in your roster once and the app can personalize comparisons, matchup advice and waiver targets.
            </p>
            <Link to="/dashboard" className="no-callout mt-4 inline-flex">
              <OpenButton>Connect my team</OpenButton>
            </Link>
          </section>
        ) : d ? (
          <PlayerNameProvider
            names={[...(d.myTeam.starters || []), ...(d.myTeam.bench || []), ...(d.opponentStarters || [])].map(p => p.name)}
          >
            <section className="app-feature-card overflow-hidden rounded-[1.6rem] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-sm font-semibold text-emerald-300">Week {d.league.week} decision center</p>
                  <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                    Compare first. Then make the move.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Player comparison is now the fastest path into the app. Use the live matchup, waiver and league context around it.
                  </p>
                </div>
                <Link
                  to="/warroom?tab=trade"
                  className="no-callout inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 shadow-[0_12px_30px_rgba(52,211,153,0.18)] transition active:scale-[0.98]"
                >
                  <GitCompareArrows className="h-5 w-5" />
                  Compare players
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <MatchupHero data={d} delay={0} />
                <WarRoomCard data={d} delay={80} />
                <WaiverLineupCard data={d} delay={160} />
              </div>
              <div className="space-y-4">
                <TeamStatusCard data={d} delay={80} />
                <LeagueRivalsCard data={d} delay={160} />
                <LeaguePulseCard data={d} delay={240} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <AnalystDoorwayCard delay={320} />
              <AiAnalystPanel data={d} delay={400} />
            </div>
          </PlayerNameProvider>
        ) : null}

        <footer className="flex items-center justify-center gap-3 py-2 text-sm text-white/40">
          <Link to="/about" className="no-callout transition-colors hover:text-white/70">About</Link>
          <span aria-hidden="true">·</span>
          <Link to="/contact" className="no-callout transition-colors hover:text-white/70">Contact</Link>
        </footer>
      </main>
      <AppNavBar />
    </div>
  );
}
