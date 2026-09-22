import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import HudPanel from "@/components/hud/HudPanel";

// Trade analyst doorway: the latest suggested question built from your live
// roster. A tap opens the full analyst chat.
export default function AnalystDoorwayCard({ delay = 0 }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("getAnalystSuggestions", {});
        if (!cancelled) setQuestion((res.data && res.data.questions && res.data.questions[0]) || null);
      } catch {
        if (!cancelled) setQuestion(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Link to="/analyst" className="no-callout block rounded-2xl transition-transform duration-200 active:scale-[0.99]">
      <HudPanel label="Trade analyst" right="ASK AI" delay={delay}>
        {loading ? (
          <p className="flex items-center gap-2 text-[11px] text-white/55">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            Reading your roster for the right question…
          </p>
        ) : question ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">Suggested ask</p>
            <p className="mt-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] leading-snug text-white/85">
              “{question}”
            </p>
          </>
        ) : (
          <p className="text-[11px] text-white/55">
            Ask anything about trades, waivers, or your lineup — the analyst reads your live ESPN data.
          </p>
        )}
        <p className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] text-white/55">
          <span className="min-w-0 truncate">Plain-English verdicts with real numbers</span>
          <span className="flex shrink-0 items-center gap-1 font-mono font-bold uppercase tracking-[0.15em] text-emerald-300/80">
            Open analyst <ChevronRight className="h-3 w-3" />
          </span>
        </p>
      </HudPanel>
    </Link>
  );
}