import React, { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import InjuryBadge from "./InjuryBadge";
import GlossaryChip from "@/components/hud/GlossaryChip";

const VERDICT_STYLES = {
  Start: "bg-emerald-400/15 text-emerald-300 border-emerald-400/40",
  Sit: "bg-rose-400/15 text-rose-300 border-rose-400/40",
  Trade: "bg-amber-400/15 text-amber-300 border-amber-400/40",
  Hold: "bg-slate-400/15 text-slate-300 border-slate-400/40",
};

function Sparkline({ points }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points.map(p => p.points), 1);
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * 60},${18 - (p.points / max) * 16}`)
    .join(" ");
  return (
    <svg viewBox="0 0 60 18" className="h-4 w-14 text-emerald-400/80" preserveAspectRatio="none">
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function PlayerCard({ player, pending, analyzing, onOpen, onAnalyze }) {
  const [open, setOpen] = useState(false);
  const a = player.analysis;

  const toggle = () => {
    if (!open && pending) onOpen("p:" + player.id);
    setOpen(!open);
  };

  return (
    <div
      onClick={toggle}
      className={`relative cursor-pointer rounded-xl border p-3 transition-all ${
        pending
          ? "border-emerald-400/60 bg-emerald-400/5 shadow-[0_0_18px_rgba(52,211,153,0.25)]"
          : "border-white/10 bg-white/5"
      }`}
    >
      {pending && (
        <span className="absolute -right-1.5 -top-1.5 animate-pulse rounded-full bg-emerald-400 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">
          NEW
        </span>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold leading-tight text-white">{player.name}</span>
            <InjuryBadge status={player.injuryStatus} />
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-white/45">
            <span className="rounded bg-white/10 px-1 py-0.5 font-medium text-white/60">{player.lineupLabel || player.position}</span>
            <span>{player.weeklyProj > 0 ? `${player.weeklyProj} proj` : `${player.seasonAvg} avg`}</span>
            <Sparkline points={player.trend} />
          </div>
        </div>
        {a ? (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${VERDICT_STYLES[a.verdict] || VERDICT_STYLES.Hold}`}>
            {a.verdict}
          </span>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onAnalyze(player); }}
            className="shrink-0 rounded-full border border-white/15 p-1 text-white/50 hover:text-emerald-300"
            title="Analyze this player"
          >
            {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          </button>
        )}
      </div>

      {a && !open && (
        <p className="mt-1.5 truncate text-[10px] text-white/50">{a.analysis}</p>
      )}

      {open && (
        <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
          {a ? (
            <>
              <p className="text-[11px] font-medium text-emerald-300">{a.news_headline}</p>
              <p className="text-[11px] leading-relaxed text-white/70">{a.analysis}</p>
              {a.factors?.length > 0 && (
                <ul className="space-y-0.5">
                  {a.factors.map((f, i) => (
                    <li key={i} className="text-[10px] text-white/50">• {f}</li>
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-white/40">
                  <GlossaryChip term="weighted_edge" bare>Edge</GlossaryChip>{" "}
                  {typeof a.weighted_edge === "number" ? a.weighted_edge.toFixed(1) : "—"} pts
                </span>
                <span
                  className={`font-semibold uppercase ${
                    a.confidence === "high" ? "text-emerald-300" : a.confidence === "medium" ? "text-amber-300" : "text-white/40"
                  }`}
                >
                  {a.confidence} confidence
                </span>
              </div>
              <p className="text-[9px] text-white/30">Updated {new Date(a.analyzed_at).toLocaleString()}</p>
            </>
          ) : (
            <p className="text-[11px] text-white/50">
              Tap the ✨ for the latest news and a start / sit / trade verdict with a confidence rating.
            </p>
          )}
        </div>
      )}
    </div>
  );
}