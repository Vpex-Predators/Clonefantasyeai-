import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Lock } from "lucide-react";
import AppNavBar from "@/components/AppNavBar";
import HudStatusBar from "@/components/hud/HudStatusBar";
import HudPanel from "@/components/hud/HudPanel";
import ThreatBoard from "@/components/warroom/ThreatBoard";
import PowerRankings from "@/components/warroom/PowerRankings";
import TradeSimulator from "@/components/warroom/TradeSimulator";

const TABS = [
  { id: "threats", label: "Threat board" },
  { id: "rankings", label: "Power rankings" },
  { id: "trade", label: "Trade sim" },
];

export default function WarRoom() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("threats");

  useEffect(() => {
    if (!isAuthenticated) {
      setData(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("getWarRoomData", {});
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || err.message || "Could not load war room intel.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const loadingData = isLoadingAuth || (isAuthenticated && loading && !data);
  const d = data && data.locked ? data : null;

  return (
    <div className="min-h-screen bg-slate-950 pb-28 text-white">
      <HudStatusBar
        title="War room"
        sub={d ? `${d.league.name.trim()} · WK ${d.league.week} · ${d.myTeam.name.trim()}` : "LEAGUE WARFARE INTEL"}
        tag={d ? "INTEL" : "STANDBY"}
      />

      <div className="mx-auto max-w-2xl space-y-3 px-3 pt-3">
        {loadingData ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
          </div>
        ) : error ? (
          <div className="border border-rose-400/30 bg-rose-400/10 p-3 font-mono text-xs text-rose-300">{error}</div>
        ) : !isAuthenticated ? (
          <HudPanel label="Access restricted">
            <p className="text-xs text-white/60">Sign in from the command briefing to access war room intel.</p>
            <Link
              to="/"
              className="mt-3 inline-block bg-emerald-400 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950 hover:bg-emerald-300"
            >
              Back to briefing
            </Link>
          </HudPanel>
        ) : data && !data.locked ? (
          <HudPanel label="Team lock required">
            <p className="text-xs text-white/60">Lock in your team to activate war room intel.</p>
            <Link
              to="/dashboard"
              className="mt-3 inline-block bg-emerald-400 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950 hover:bg-emerald-300"
            >
              Go to dashboard
            </Link>
          </HudPanel>
        ) : d ? (
          <>
            <div className="grid grid-cols-3 border border-white/10 bg-white/[0.03] p-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors ${
                    tab === t.id ? "bg-emerald-400 text-slate-950" : "text-white/55 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === "threats" && <ThreatBoard board={d.threatBoard} />}
            {tab === "rankings" && <PowerRankings data={d} />}
            {tab === "trade" && <TradeSimulator data={d} />}
          </>
        ) : null}
      </div>
      <AppNavBar />
    </div>
  );
}