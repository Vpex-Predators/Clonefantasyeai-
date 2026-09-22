import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, ChevronRight, Plus, ShieldAlert, ShieldCheck } from "lucide-react";
import HudPanel from "@/components/hud/HudPanel";

// League pulse doorway: league-wide activity counts plus the collusion
// pattern detectors in compact form — all-clear badge or the top flags.
// A tap opens the full League tab on My Team.
export default function LeaguePulseCard({ data, delay = 0 }) {
  const pulse = data.leaguePulse;
  if (!pulse) return null;
  const moves = pulse.movesAvailable === false ? [] : pulse.moves || [];
  const trades = moves.filter(m => m.kind === "trade" || m.kind === "trade_pending").length;
  const adds = moves.filter(m => m.kind === "add").length;
  const flags = pulse.flags || [];

  const chip = (Icon, label) => (
    <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">
      <Icon className="h-3 w-3 text-emerald-300" />
      {label}
    </span>
  );

  return (
    <Link to="/dashboard?tab=league" className="no-callout block rounded-2xl transition-transform duration-200 active:scale-[0.99]">
      <HudPanel label="League pulse" right={`${data.teams.length} TEAMS`} delay={delay}>
        <div className="flex flex-wrap gap-1.5">
          {chip(Plus, `${adds} adds`)}
          {chip(ArrowLeftRight, `${trades} trades`)}
          {chip(Plus, `${moves.length} total moves`)}
        </div>

        <div className="mt-2.5">
          {flags.length ? (
            <>
              <p className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-rose-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                {flags.length} pattern{flags.length > 1 ? "s" : ""} flagged
              </p>
              <ul className="mt-1.5 space-y-1">
                {flags.slice(0, 2).map((f, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-2 py-1.5 text-[11px] leading-snug text-white/85"
                  >
                    {f.quip}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 text-[11px] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              All clear — no lopsided trade loops, tanking, or wire games in the numbers.
            </p>
          )}
        </div>

        <p className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] text-white/55">
          <span className="min-w-0 truncate">Detectors, not accusations — full season scan on the League tab</span>
          <span className="flex shrink-0 items-center gap-1 font-mono font-bold uppercase tracking-[0.15em] text-emerald-300/80">
            Open league <ChevronRight className="h-3 w-3" />
          </span>
        </p>
      </HudPanel>
    </Link>
  );
}